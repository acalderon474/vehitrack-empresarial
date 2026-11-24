
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    output,
    signal
} from '@angular/core';

import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { SolicitudService } from '../../../core/services/solicitud.service';

import type { EstadoSolicitud } from '../../../core/models/solicitud';
import type {
    FiltrosSolicitudes,
    SolicitudResumen
} from '../../../core/models/solicitud-resumen';

import {
    ESTADOS_SOLICITUD,
    etiquetaEstado,
    puedeCancelar,
    puedeEditar
} from '../estados-solicitud';

import { mensajeDeError } from '../mensajes-error';
import { noVacio } from '../solicitud-formulario/solicitud-formulario.validadores';

/** Minúsculas y sin tildes, para buscar sin importar cómo se escriba. */
function normalizar(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
}

const ZONA_HORARIA = 'America/Bogota';

interface Conteos {
    pendiente: number;
    asignada: number;
    finalizada: number;
    cancelada: number;
}

/** Partes de una fecha en hora de Colombia (con el ciclo 00-23, sin "24:00"). */
function partesDeFecha(iso: string): Record<string, string> {

    const partes = new Intl.DateTimeFormat('es-CO', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(new Date(iso));

    return Object.fromEntries(partes.map(p => [p.type, p.value]));
}

/**
 * VT-011. Listado de solicitudes con filtros por estado, fecha y cliente,
 * y cancelación con motivo obligatorio.
 *
 * El estado y la fecha se envían al backend; el cliente se filtra aquí
 * porque el contrato de la matriz aún no define ese parámetro.
 */
@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-solicitud-listado',
    styleUrl: './solicitud-listado.scss',
    templateUrl: './solicitud-listado.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudListado {

    private readonly servicio = inject(SolicitudService);
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly router = inject(Router);

    private carga: Subscription | null = null;
    private cargaConteos: Subscription | null = null;

    /** Verdadero mientras se usan datos de ejemplo (sin API configurada). */
    readonly datosSimulados = this.servicio.usaDatosSimulados === true;

    /** El usuario pidió editar una solicitud. */
    readonly editar = output<SolicitudResumen>();

    readonly estados = ESTADOS_SOLICITUD;

    readonly filtros = this.fb.group({
        estado: this.fb.control<EstadoSolicitud | ''>(''),
        fecha: this.fb.control('')
    });

    readonly textoCliente = signal('');

    /** Conteo por estado de TODAS las solicitudes (no depende de los filtros). */
    readonly conteos = signal<Conteos>({
        pendiente: 0,
        asignada: 0,
        finalizada: 0,
        cancelada: 0
    });

    private readonly idSeleccionada = signal<string | null>(null);

    readonly solicitudes = signal<SolicitudResumen[]>([]);
    readonly total = signal(0);
    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);
    readonly aviso = signal<string | null>(null);

    readonly porCancelar = signal<SolicitudResumen | null>(null);
    readonly procesando = signal(false);
    readonly errorCancelar = signal<string | null>(null);

    readonly motivo = this.fb.control('', [
        Validators.required,
        noVacio,
        Validators.minLength(3),
        Validators.maxLength(200)
    ]);

    /** Solicitudes que coinciden con el texto de cliente (o de código). */
    readonly visibles = computed(() => {

        const texto = normalizar(this.textoCliente());

        if (texto === '') {
            return this.solicitudes();
        }

        return this.solicitudes().filter(s =>
            normalizar(s.nombreCliente ?? '').includes(texto) ||
            normalizar(s.codigo).includes(texto)
        );
    });

    /**
     * Solicitud cuyo detalle se muestra: la elegida por el usuario o,
     * si no hay una elegida visible, la primera de la lista.
     */
    readonly seleccionada = computed<SolicitudResumen | null>(() => {

        const lista = this.visibles();
        const id = this.idSeleccionada();

        return lista.find(s => s.id === id) ?? lista[0] ?? null;
    });

    constructor() {
        this.filtros.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cargar());

        this.cargar();
    }

    /** Consulta el listado con los filtros actuales. */
    cargar(): void {

        const { estado, fecha } = this.filtros.getRawValue();

        const consulta: FiltrosSolicitudes = {};

        if (estado !== '') {
            consulta.estado = estado;
        }
        if (fecha !== '') {
            consulta.fecha = fecha;
        }

        this.cargando.set(true);
        this.error.set(null);

        // Si llega una consulta nueva, se descarta la anterior.
        this.carga?.unsubscribe();

        this.carga = this.servicio.listar(consulta).subscribe({
            next: listado => {
                this.solicitudes.set(listado.elementos);
                this.total.set(listado.total);
                this.cargando.set(false);

                if (estado === '' && fecha === '') {
                    this.actualizarConteos(listado.elementos);
                } else {
                    this.consultarConteos();
                }
            },
            error: (fallo: unknown) => {
                this.cargando.set(false);
                this.error.set(mensajeDeError(fallo, 'cargar las solicitudes'));
            }
        });
    }

    /** Con filtros activos, los conteos se consultan aparte, sin filtros. */
    private consultarConteos(): void {

        this.cargaConteos?.unsubscribe();

        this.cargaConteos = this.servicio.listar({}).subscribe({
            next: listado => this.actualizarConteos(listado.elementos),
            // Si falla, se conservan los conteos anteriores.
            error: () => undefined
        });
    }

    private actualizarConteos(elementos: SolicitudResumen[]): void {

        const conteos: Conteos = {
            pendiente: 0,
            asignada: 0,
            finalizada: 0,
            cancelada: 0
        };

        for (const solicitud of elementos) {
            conteos[solicitud.estado] += 1;
        }

        this.conteos.set(conteos);
    }

    /** Elige la solicitud cuyo detalle se muestra. */
    seleccionar(solicitud: SolicitudResumen): void {
        this.idSeleccionada.set(solicitud.id);
    }

    /**
     * Pendiente: lleva a las recomendaciones de vehículo.
     * Asignada o finalizada: lleva al historial de la asignación.
     * La pantalla de Asignaciones leerá el parámetro `solicitud`.
     */
    irAAsignacion(solicitud: SolicitudResumen): void {
        void this.router.navigate(['/asignaciones'], {
            queryParams: { solicitud: solicitud.id }
        });
    }

    textoAccionAsignacion(solicitud: SolicitudResumen): string | null {

        switch (solicitud.estado) {
            case 'pendiente':
                return 'Ver recomendaciones';
            case 'asignada':
            case 'finalizada':
                return 'Ver historial';
            default:
                return null;
        }
    }

    /** Nota sobre lo que se puede hacer con la solicitud elegida. */
    notaDeEstado(solicitud: SolicitudResumen): string {

        switch (solicitud.estado) {
            case 'pendiente':
                return 'Pendiente de asignación: puedes editarla o ver las recomendaciones de vehículo.';
            case 'asignada':
                return 'Con asignación vigente: la fecha, los pasajeros y la ruta están bloqueados para edición.';
            case 'finalizada':
                return 'Registro de referencia ya finalizado; bloqueado para edición de ruta.';
            default:
                return solicitud.motivoCancelacion !== undefined
                    ? `Solicitud cancelada (${solicitud.motivoCancelacion}); bloqueada para edición.`
                    : 'Solicitud cancelada; bloqueada para edición.';
        }
    }

    /** Vuelve a consultar (por ejemplo, después de registrar o editar). */
    recargar(): void {
        this.cargar();
    }

    limpiarFiltros(): void {
        this.textoCliente.set('');
        this.filtros.reset();
    }

    iniciarCancelacion(solicitud: SolicitudResumen): void {
        this.aviso.set(null);
        this.errorCancelar.set(null);
        this.motivo.reset();
        this.porCancelar.set(solicitud);
    }

    cerrarCancelacion(): void {
        this.porCancelar.set(null);
        this.errorCancelar.set(null);
    }

    confirmarCancelacion(): void {

        const solicitud = this.porCancelar();

        if (solicitud === null || this.procesando()) {
            return;
        }

        if (this.motivo.invalid) {
            this.motivo.markAsTouched();
            return;
        }

        this.procesando.set(true);
        this.errorCancelar.set(null);

        this.servicio.cambiarEstado(solicitud.id, {
            estado: 'cancelada',
            motivo_cancelacion: this.motivo.value.trim()
        }).subscribe({
            next: () => {
                this.procesando.set(false);
                this.porCancelar.set(null);
                this.aviso.set(`La solicitud ${solicitud.codigo} fue cancelada.`);
                this.cargar();
            },
            error: (fallo: unknown) => {
                this.procesando.set(false);
                this.errorCancelar.set(
                    mensajeDeError(fallo, 'cancelar la solicitud')
                );
            }
        });
    }

    mensajeMotivo(): string {

        if (!this.motivo.touched || !this.motivo.errors) {
            return '';
        }

        const e = this.motivo.errors;

        if (e['required'] || e['noVacio']) {
            return 'Escribe el motivo de la cancelación.';
        }
        if (e['minlength']) {
            return 'El motivo debe tener al menos 3 caracteres.';
        }
        if (e['maxlength']) {
            return 'El motivo no puede superar 200 caracteres.';
        }

        return 'Motivo no válido.';
    }

    puedeEditar(solicitud: SolicitudResumen): boolean {
        return puedeEditar(solicitud.estado);
    }

    puedeCancelar(solicitud: SolicitudResumen): boolean {
        return puedeCancelar(solicitud.estado);
    }

    etiquetaEstado(estado: EstadoSolicitud): string {
        return etiquetaEstado(estado);
    }

    ruta(solicitud: SolicitudResumen): string {

        const origen = solicitud.origen?.direccion;
        const destino = solicitud.destino?.direccion;

        return origen !== undefined && destino !== undefined
            ? `${origen} → ${destino}`
            : '—';
    }

    /** Fecha corta del diseño: "20/11 · 12:00" (hora de Colombia). */
    fechaCorta(solicitud: SolicitudResumen): string {

        if (solicitud.fechaHora === undefined) {
            return '—';
        }

        const p = partesDeFecha(solicitud.fechaHora);

        return `${p['day']}/${p['month']} · ${p['hour']}:${p['minute']}`;
    }

    /** Fecha completa para el detalle: "20/11/2026 · 12:00". */
    fechaLarga(solicitud: SolicitudResumen): string {

        if (solicitud.fechaHora === undefined) {
            return '—';
        }

        const p = partesDeFecha(solicitud.fechaHora);

        return `${p['day']}/${p['month']}/${p['year']} · ${p['hour']}:${p['minute']}`;
    }

    /**
     * Tarifa como en el diseño: "$120.000".
     * El separador de miles se pone a mano para que también agrupe
     * los números de cuatro cifras ("$9.500"), que Intl no agrupa en es-CO.
     */
    formatoCop(valor: number): string {
        return '$' + String(Math.round(valor))
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    texto(valor: string | undefined): string {
        return valor !== undefined && valor !== '' ? valor : '—';
    }
}
