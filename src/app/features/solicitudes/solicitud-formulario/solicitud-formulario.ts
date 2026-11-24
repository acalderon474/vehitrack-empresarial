
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';

import {
    AbstractControl,
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { SolicitudService } from '../../../core/services/solicitud.service';

import type {
    EstadoSolicitud,
    NuevaSolicitud,
    Solicitud,
    UbicacionSolicitud
} from '../../../core/models/solicitud';

import type {
    CambiosSolicitud,
    SolicitudResumen
} from '../../../core/models/solicitud-resumen';

import { etiquetaEstado, rutaEditable } from '../estados-solicitud';
import { mensajeDeError } from '../mensajes-error';

import {
    coordenadasCompletas,
    entero,
    noPasado,
    noVacio
} from './solicitud-formulario.validadores';

interface ValorUbicacion {
    direccion: string;
    lat: number | null;
    lng: number | null;
}

interface ValorFormulario {
    nombreCliente: string;
    origen: ValorUbicacion;
    destino: ValorUbicacion;
    fechaHora: string;
    cantidadPasajeros: number | null;
    tarifa: number | null;
}

/** Límite razonable y provisional de pasajeros por solicitud. */
const MAX_PASAJEROS = 100;

/**
 * VT-010 y VT-011. Formulario para registrar y para editar
 * una solicitud de transporte.
 *
 * Registro: valida los datos, muestra el resultado (código, estado,
 * distancia y duración estimadas) y emite `registrada`.
 *
 * Edición (cuando se recibe `solicitudEditar`): carga los datos de la
 * solicitud y emite `guardada`. Si ya tiene una asignación vigente,
 * la ruta, la fecha y los pasajeros quedan bloqueados y solo se
 * pueden cambiar el cliente y la tarifa.
 */
@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-solicitud-formulario',
    styleUrl: './solicitud-formulario.scss',
    templateUrl: './solicitud-formulario.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudFormulario implements OnInit {

    private readonly fb = inject(NonNullableFormBuilder);
    private readonly solicitudes = inject(SolicitudService);

    readonly maxPasajeros = MAX_PASAJEROS;

    /** Solicitud que se va a editar; si no se recibe, el formulario registra una nueva. */
    readonly solicitudEditar = input<SolicitudResumen | null>(null);

    readonly esEdicion = computed(() => this.solicitudEditar() !== null);

    /** En edición: la ruta, la fecha y los pasajeros están bloqueados. */
    readonly rutaBloqueada = computed(() => {
        const solicitud = this.solicitudEditar();
        return solicitud !== null && !rutaEditable(solicitud.estado);
    });

    /** Se emite cuando el backend confirma el registro. */
    readonly registrada = output<Solicitud>();

    /** Se emite cuando el backend confirma los cambios de una edición. */
    readonly guardada = output<void>();

    /** Se emite cuando el usuario cierra el formulario sin más acciones. */
    readonly cerrado = output<void>();

    readonly enviando = signal(false);
    readonly error = signal<string | null>(null);
    readonly resultado = signal<Solicitud | null>(null);

    readonly formulario = this.fb.group({
        nombreCliente: this.fb.control('', [
            Validators.required,
            noVacio,
            Validators.maxLength(120)
        ]),

        origen: this.fb.group({
            direccion: this.fb.control('', [
                Validators.required,
                noVacio,
                Validators.maxLength(200)
            ]),
            lat: this.fb.control<number | null>(null, [
                Validators.min(-90),
                Validators.max(90)
            ]),
            lng: this.fb.control<number | null>(null, [
                Validators.min(-180),
                Validators.max(180)
            ])
        }, { validators: coordenadasCompletas }),

        destino: this.fb.group({
            direccion: this.fb.control('', [
                Validators.required,
                noVacio,
                Validators.maxLength(200)
            ]),
            lat: this.fb.control<number | null>(null, [
                Validators.min(-90),
                Validators.max(90)
            ]),
            lng: this.fb.control<number | null>(null, [
                Validators.min(-180),
                Validators.max(180)
            ])
        }, { validators: coordenadasCompletas }),

        fechaHora: this.fb.control('', [
            Validators.required,
            noPasado
        ]),

        cantidadPasajeros: this.fb.control<number | null>(null, [
            Validators.required,
            Validators.min(1),
            Validators.max(MAX_PASAJEROS),
            entero
        ]),

        tarifa: this.fb.control<number | null>(null, [
            Validators.required,
            Validators.min(1),
            entero
        ])
    });

    ngOnInit(): void {

        const solicitud = this.solicitudEditar();

        if (solicitud === null) {
            return;
        }

        this.formulario.patchValue({
            nombreCliente: solicitud.nombreCliente ?? '',
            origen: {
                direccion: solicitud.origen?.direccion ?? '',
                lat: solicitud.origen?.lat ?? null,
                lng: solicitud.origen?.lng ?? null
            },
            destino: {
                direccion: solicitud.destino?.direccion ?? '',
                lat: solicitud.destino?.lat ?? null,
                lng: solicitud.destino?.lng ?? null
            },
            fechaHora: solicitud.fechaHora
                ? aInputLocal(new Date(solicitud.fechaHora))
                : '',
            cantidadPasajeros: solicitud.cantidadPasajeros,
            tarifa: solicitud.tarifa
        });

        if (this.rutaBloqueada()) {
            this.formulario.controls.origen.disable();
            this.formulario.controls.destino.disable();
            this.formulario.controls.fechaHora.disable();
            this.formulario.controls.cantidadPasajeros.disable();
        }
    }

    /** Fecha mínima que acepta el selector (ahora, en hora local). */
    get fechaMinima(): string {
        return aInputLocal(new Date());
    }

    enviar(): void {

        if (this.enviando()) {
            return;
        }

        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const valor = this.formulario.getRawValue();

        const edicion = this.solicitudEditar();

        if (edicion !== null) {
            this.guardarCambios(edicion, valor);
            return;
        }

        const nueva: NuevaSolicitud = {
            nombreCliente: valor.nombreCliente.trim(),
            origen: aUbicacion(valor.origen),
            destino: aUbicacion(valor.destino),
            fechaHora: new Date(valor.fechaHora).toISOString(),
            cantidadPasajeros: Number(valor.cantidadPasajeros),
            tarifa: Number(valor.tarifa)
        };

        this.enviando.set(true);
        this.error.set(null);

        this.solicitudes.crear(nueva).subscribe({
            next: solicitud => {
                this.enviando.set(false);
                this.resultado.set(solicitud);
                this.registrada.emit(solicitud);
            },
            error: (fallo: unknown) => {
                this.enviando.set(false);
                this.error.set(mensajeDeError(fallo, 'registrar la solicitud'));
            }
        });
    }

    private guardarCambios(
        edicion: SolicitudResumen,
        valor: ValorFormulario
    ): void {

        const cambios: CambiosSolicitud = this.rutaBloqueada()
            ? {
                nombreCliente: valor.nombreCliente.trim(),
                tarifa: Number(valor.tarifa)
            }
            : {
                nombreCliente: valor.nombreCliente.trim(),
                origen: aUbicacion(valor.origen),
                destino: aUbicacion(valor.destino),
                fechaHora: new Date(valor.fechaHora).toISOString(),
                cantidadPasajeros: Number(valor.cantidadPasajeros),
                tarifa: Number(valor.tarifa)
            };

        this.enviando.set(true);
        this.error.set(null);

        this.solicitudes.actualizar(edicion.id, cambios).subscribe({
            next: () => {
                this.enviando.set(false);
                this.guardada.emit();
            },
            error: (fallo: unknown) => {
                this.enviando.set(false);
                this.error.set(mensajeDeError(fallo, 'guardar los cambios'));
            }
        });
    }

    /** Cierra el formulario (o el resultado) y vuelve al listado. */
    cerrar(): void {
        this.cerrado.emit();
    }

    /** Vuelve al formulario vacío para registrar otra solicitud. */
    registrarOtra(): void {
        this.resultado.set(null);
        this.error.set(null);
        this.formulario.reset();
    }

    /** Mensaje de validación de un campo, o cadena vacía si no hay. */
    mensajeError(control: AbstractControl): string {

        if (!(control.touched || control.dirty) || !control.errors) {
            return '';
        }

        const e = control.errors;

        if (e['required']) {
            return 'Este campo es obligatorio.';
        }
        if (e['noVacio']) {
            return 'No puede estar vacío.';
        }
        if (e['maxlength']) {
            return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
        }
        if (e['entero']) {
            return 'Debe ser un número entero.';
        }
        if (e['min']) {
            return `El valor mínimo es ${e['min'].min}.`;
        }
        if (e['max']) {
            return `El valor máximo es ${e['max'].max}.`;
        }
        if (e['fechaPasada']) {
            return 'La fecha y hora deben estar en el futuro.';
        }
        if (e['fechaInvalida']) {
            return 'Fecha y hora no válidas.';
        }
        if (e['coordenadasIncompletas']) {
            return 'Indica latitud y longitud, o deja ambas vacías.';
        }

        return 'Valor no válido.';
    }

    etiquetaEstado(estado: EstadoSolicitud): string {
        return etiquetaEstado(estado);
    }

    formatoCop(valor: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(valor);
    }

    formatoDuracion(minutos: number): string {
        const horas = Math.floor(minutos / 60);
        const resto = minutos % 60;

        if (horas === 0) {
            return `${resto} min`;
        }

        return resto === 0
            ? `${horas} h`
            : `${horas} h ${resto} min`;
    }
}

function aUbicacion(valor: ValorUbicacion): UbicacionSolicitud {

    const ubicacion: UbicacionSolicitud = {
        direccion: valor.direccion.trim()
    };

    // Las coordenadas se envían solo si están completas;
    // el cero es una coordenada válida.
    if (valor.lat !== null && valor.lng !== null) {
        ubicacion.lat = Number(valor.lat);
        ubicacion.lng = Number(valor.lng);
    }

    return ubicacion;
}

/** Formato que entiende <input type="datetime-local">. */
function aInputLocal(fecha: Date): string {

    const dos = (n: number): string => String(n).padStart(2, '0');

    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
        `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
