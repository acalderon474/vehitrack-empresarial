import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { AsignacionService } from '../../core/services/asignacion.service';
import { SolicitudService } from '../../core/services/solicitud.service';

import type {
  AlternativaAsignacion,
  ConductorDisponible,
  ConfirmacionAsignacion,
  HistorialAsignacion,
  RecomendacionesAsignacion,
} from '../../core/models/asignacion-flujo';

import type { SolicitudResumen } from '../../core/models/solicitud-resumen';
import { formatoCop } from '../../core/utils/formato';
import { mensajeDeError } from '../solicitudes/mensajes-error';

import { AlternativaVehiculo } from './alternativa-vehiculo/alternativa-vehiculo';

type Modo = 'sin-solicitud' | 'cargando' | 'asignar' | 'historial' | 'cancelada' | 'error';

const CONFLICTO_ASIGNACION =
  'El vehículo o el conductor ya no están disponibles, o la solicitud cambió. Actualiza las recomendaciones e inténtalo de nuevo.';

/**
 * VT-012 y VT-013. Comparación y recomendación de vehículos.
 *
 * - Sin solicitud en la dirección (`?solicitud=`): permite elegir una pendiente.
 * - Solicitud pendiente: compara las alternativas, deja elegir vehículo y
 *   conductor y confirma la asignación. El sistema recomienda; el
 *   coordinador conserva la decisión final.
 * - Solicitud asignada o finalizada: muestra el historial de la asignación.
 */
@Component({
  imports: [ReactiveFormsModule, AlternativaVehiculo],
  selector: 'app-asignaciones',
  styleUrl: './asignaciones.scss',
  templateUrl: './asignaciones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Asignaciones {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly solicitudes = inject(SolicitudService);
  private readonly asignaciones = inject(AsignacionService);
  private readonly fb = inject(NonNullableFormBuilder);

  private carga: Subscription | null = null;

  readonly idSolicitud = signal<string | null>(null);
  readonly solicitud = signal<SolicitudResumen | null>(null);
  readonly pendientes = signal<SolicitudResumen[]>([]);

  readonly recomendaciones = signal<RecomendacionesAsignacion | null>(null);
  readonly conductores = signal<ConductorDisponible[]>([]);
  readonly historial = signal<HistorialAsignacion | null>(null);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly vehiculoElegido = signal<string | null>(null);
  readonly confirmando = signal(false);
  readonly errorConfirmar = signal<string | null>(null);
  readonly confirmacion = signal<ConfirmacionAsignacion | null>(null);

  /** Se muestra el mensaje de validación después de intentar confirmar. */
  readonly intentoConfirmar = signal(false);

  readonly conductorId = this.fb.control('');
  readonly motivo = this.fb.control('');

  readonly modo = computed<Modo>(() => {
    if (this.idSolicitud() === null) {
      return 'sin-solicitud';
    }
    if (this.cargando()) {
      return 'cargando';
    }
    if (this.error() !== null) {
      return 'error';
    }
    if (this.historial() !== null) {
      return 'historial';
    }
    if (this.solicitud()?.estado === 'cancelada') {
      return 'cancelada';
    }
    return 'asignar';
  });

  readonly alternativas = computed<AlternativaAsignacion[]>(
    () => this.historial()?.alternativas ?? this.recomendaciones()?.alternativas ?? [],
  );

  readonly recomendada = computed(() => this.alternativas().find((a) => a.recomendado) ?? null);

  /** Alternativa elegida para confirmar (por defecto, la recomendada). */
  readonly alternativaElegida = computed(() => {
    const id = this.vehiculoElegido();
    return this.alternativas().find((a) => a.vehiculoId === id) ?? this.recomendada();
  });

  /** El motivo es obligatorio si se elige algo distinto de la recomendación. */
  readonly motivoObligatorio = computed(() => {
    const elegida = this.alternativaElegida();
    return elegida !== null && !elegida.recomendado;
  });

  /** Alternativa con la que se confirmó la asignación (historial). */
  readonly alternativaConfirmada = computed(() => {
    const h = this.historial();
    return h === null
      ? null
      : (h.alternativas.find((a) => a.vehiculoId === h.vehiculoElegidoId) ?? null);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((parametros) => {
      this.abrir(parametros.get('solicitud'));
    });
  }

  /** Carga lo que corresponde según la solicitud indicada en la dirección. */
  abrir(id: string | null): void {
    this.carga?.unsubscribe();

    this.solicitud.set(null);
    this.recomendaciones.set(null);
    this.historial.set(null);
    this.conductores.set([]);
    this.error.set(null);
    this.errorConfirmar.set(null);
    this.confirmacion.set(null);
    this.vehiculoElegido.set(null);
    this.intentoConfirmar.set(false);
    this.conductorId.reset();
    this.motivo.reset();

    this.idSolicitud.set(id);

    if (id === null) {
      this.cargarPendientes();
      return;
    }

    this.cargando.set(true);

    this.carga = this.solicitudes.obtener(id).subscribe({
      next: (solicitud) => {
        this.solicitud.set(solicitud);
        this.cargarSegunEstado(solicitud);
      },
      error: (fallo: unknown) => this.fallar(fallo, 'cargar la solicitud'),
    });
  }

  private cargarPendientes(): void {
    this.cargando.set(true);

    this.carga = this.solicitudes.listar({ estado: 'pendiente' }).subscribe({
      next: (listado) => {
        this.pendientes.set(listado.elementos);
        this.cargando.set(false);
      },
      error: (fallo: unknown) => this.fallar(fallo, 'cargar las solicitudes pendientes'),
    });
  }

  private cargarSegunEstado(solicitud: SolicitudResumen): void {
    switch (solicitud.estado) {
      case 'pendiente':
        this.carga = forkJoin({
          recomendaciones: this.asignaciones.recomendar(solicitud.id),
          conductores: this.asignaciones.listarConductoresDisponibles(),
        }).subscribe({
          next: ({ recomendaciones, conductores }) => {
            this.recomendaciones.set(recomendaciones);
            this.conductores.set(conductores);
            this.cargando.set(false);
          },
          error: (fallo: unknown) => this.fallar(fallo, 'cargar las recomendaciones'),
        });
        break;

      case 'asignada':
      case 'finalizada':
        this.carga = this.asignaciones.obtenerHistorial(solicitud.id).subscribe({
          next: (historial) => {
            this.historial.set(historial);
            this.cargando.set(false);
          },
          error: (fallo: unknown) => this.fallar(fallo, 'cargar el historial de la asignación'),
        });
        break;

      default:
        this.cargando.set(false);
    }
  }

  private fallar(fallo: unknown, accion: string): void {
    this.cargando.set(false);
    this.error.set(mensajeDeError(fallo, accion));
  }

  /** Pasa de la lista de pendientes a las recomendaciones de una solicitud. */
  elegirSolicitud(id: string): void {
    void this.router.navigate(['/asignaciones'], { queryParams: { solicitud: id } });
  }

  volverASolicitudes(): void {
    void this.router.navigate(['/solicitudes']);
  }

  elegirVehiculo(vehiculoId: string): void {
    this.vehiculoElegido.set(vehiculoId);
    this.errorConfirmar.set(null);
  }

  /** Vuelve a pedir las recomendaciones (por ejemplo, tras un conflicto). */
  actualizar(): void {
    this.abrir(this.idSolicitud());
  }

  confirmar(): void {
    const solicitud = this.solicitud();
    const alternativa = this.alternativaElegida();

    if (solicitud === null || alternativa === null || this.confirmando()) {
      return;
    }

    this.intentoConfirmar.set(true);

    if (this.mensajeConductor() !== '' || this.mensajeMotivo() !== '') {
      return;
    }

    this.confirmando.set(true);
    this.errorConfirmar.set(null);

    this.asignaciones
      .confirmar({
        solicitudId: solicitud.id,
        vehiculoId: alternativa.vehiculoId,
        conductorId: this.conductorId.value,
        motivoSeleccion: this.motivo.value.trim(),
      })
      .subscribe({
        next: (confirmacion) => {
          this.confirmando.set(false);
          this.confirmacion.set(confirmacion);
        },
        error: (fallo: unknown) => {
          this.confirmando.set(false);
          this.errorConfirmar.set(
            mensajeDeError(fallo, 'confirmar la asignación', CONFLICTO_ASIGNACION),
          );
        },
      });
  }

  /** Muestra el historial de la asignación recién confirmada. */
  verHistorial(): void {
    this.abrir(this.idSolicitud());
  }

  mensajeConductor(): string {
    if (!this.intentoConfirmar()) {
      return '';
    }

    const id = this.conductorId.value;

    if (id === '') {
      return 'Elige el conductor del servicio.';
    }

    const conductor = this.conductores().find((c) => c.id === id);

    return conductor !== undefined && this.licenciaVencida(conductor)
      ? 'La licencia de este conductor está vencida.'
      : '';
  }

  mensajeMotivo(): string {
    if (!this.intentoConfirmar() || !this.motivoObligatorio()) {
      return '';
    }

    return this.motivo.value.trim() === ''
      ? 'Indica por qué eliges un vehículo distinto del recomendado.'
      : '';
  }

  /** La licencia vence antes de la fecha del servicio. */
  licenciaVencida(conductor: ConductorDisponible): boolean {
    const vence = conductor.vencimientoLicencia;
    const fecha = this.solicitud()?.fechaHora;

    if (vence === undefined || fecha === undefined) {
      return false;
    }

    return new Date(vence).getTime() < new Date(fecha).getTime();
  }

  etiquetaConductor(conductor: ConductorDisponible): string {
    const codigo = conductor.codigo !== undefined ? `${conductor.codigo} · ` : '';
    const licencia = conductor.categoriaLicencia ? ` · Licencia ${conductor.categoriaLicencia}` : '';
    const aviso = this.licenciaVencida(conductor) ? ' (licencia vencida)' : '';

    return `${codigo}${conductor.nombreCompleto}${licencia}${aviso}`;
  }

  letra(indice: number): string {
    return String.fromCharCode(65 + indice);
  }

  nombreVehiculo(alternativa: AlternativaAsignacion | null): string {
    return alternativa === null ? '—' : (alternativa.codigoVehiculo ?? alternativa.placa);
  }

  /** Subtítulo con los datos de la solicitud, como en el diseño. */
  resumenSolicitud(solicitud: SolicitudResumen, conCodigo = true): string {
    const partes: string[] = conCodigo ? [solicitud.codigo] : [];

    if (solicitud.origen?.direccion !== undefined && solicitud.destino?.direccion !== undefined) {
      partes.push(`${solicitud.origen.direccion} → ${solicitud.destino.direccion}`);
    }

    partes.push(
      `${solicitud.cantidadPasajeros} ${solicitud.cantidadPasajeros === 1 ? 'pasajero' : 'pasajeros'}`,
    );
    partes.push(`tarifa ${formatoCop(solicitud.tarifa)}`);

    return partes.join(' · ');
  }

  /** Diferencia entre el margen registrado al cierre y el previsto. */
  diferenciaMargen(h: HistorialAsignacion): string {
    return h.margenRegistrado === undefined
      ? '—'
      : formatoCop(h.margenRegistrado - h.margenPrevisto);
  }

  formatoCop(valor: number): string {
    return formatoCop(valor);
  }
}
