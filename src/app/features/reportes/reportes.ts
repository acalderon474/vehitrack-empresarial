import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CopPipe } from '../../core/pipes/cop.pipe';
import { RecorridoService } from '../../core/services/recorrido.service';
import { ReporteService } from '../../core/services/reporte.service';
import { PERIODO_DATOS_PRUEBA } from '../../core/mocks/recorridos-prueba.store';
import { apiConfigurada } from '../../core/utils/respuesta-api';

import type { FiltrosReporteDto, ReporteRentabilidadDto } from '../../core/dto/reporte.dto';

interface MargenPorVehiculo {
  placa: string;
  margen: number;
  porcentajeAltura: number;
}

interface OpcionFiltro {
  id: string;
  etiqueta: string;
}

/** Período y filtros con los que se obtuvo el reporte mostrado. */
interface ConsultaAplicada {
  desde: string;
  hasta: string;
  vehiculo?: string;
  conductor?: string;
}

function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** 2026-11-01 → 01/11/2026 */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Con datos de prueba, el período inicial cubre los cierres
 * de demostración aunque la fecha actual sea posterior.
 * Con API, el período inicial es el mes en curso.
 */
export function periodoInicial(datosDePrueba: boolean, hoy = new Date()): { desde: string; hasta: string } {
  const hoyIso = fechaIso(hoy);

  if (datosDePrueba) {
    return {
      desde: PERIODO_DATOS_PRUEBA.desde,
      hasta: hoyIso > PERIODO_DATOS_PRUEBA.hasta ? hoyIso : PERIODO_DATOS_PRUEBA.hasta,
    };
  }

  return {
    desde: fechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: hoyIso,
  };
}

@Component({
  imports: [FormsModule, CopPipe],
  selector: 'app-reportes',
  styleUrl: './reportes.scss',
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {

  private readonly servicio = inject(ReporteService);
  private readonly recorridoServicio = inject(RecorridoService);

  readonly datosDePrueba = !apiConfigurada();

  desde = periodoInicial(this.datosDePrueba).desde;
  hasta = periodoInicial(this.datosDePrueba).hasta;
  vehiculoId = '';
  conductorId = '';

  readonly vehiculos = signal<OpcionFiltro[]>([]);
  readonly conductores = signal<OpcionFiltro[]>([]);

  readonly reporte = signal<ReporteRentabilidadDto | null>(null);
  readonly consultaAplicada = signal<ConsultaAplicada | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly recorridos = computed(() => this.reporte()?.recorridos ?? []);

  readonly margenPrevisto = computed(() =>
    this.recorridos().reduce((total, r) => total + r.margen_estimado, 0)
  );

  readonly margenRegistrado = computed(() =>
    this.recorridos().reduce((total, r) => total + r.margen_real, 0)
  );

  readonly variacionMargen = computed(() =>
    this.margenRegistrado() - this.margenPrevisto()
  );

  readonly porVehiculo = computed<MargenPorVehiculo[]>(() => {
    const totales = new Map<string, number>();

    for (const r of this.recorridos()) {
      totales.set(r.placa, (totales.get(r.placa) ?? 0) + r.margen_real);
    }

    const maximo = Math.max(1, ...[...totales.values()].map(v => Math.abs(v)));

    return [...totales.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([placa, margen]) => ({
        placa,
        margen,
        porcentajeAltura: Math.max(4, Math.round(Math.abs(margen) / maximo * 100)),
      }));
  });

  readonly formatearFecha = formatearFecha;

  ngOnInit(): void {
    this.cargarOpcionesDeFiltro();
    this.consultar();
  }

  /** Vehículos y conductores que aparecen en los recorridos registrados. */
  private cargarOpcionesDeFiltro(): void {
    this.recorridoServicio.listar().subscribe({
      next: lista => {
        const vehiculos = new Map<string, string>();
        const conductores = new Map<string, string>();

        for (const r of lista) {
          vehiculos.set(r.vehiculoId, r.placa);
          conductores.set(r.conductorId, `${r.conductorNombre} (${r.conductorCodigo})`);
        }

        const aOpciones = (mapa: Map<string, string>): OpcionFiltro[] =>
          [...mapa.entries()]
            .map(([id, etiqueta]) => ({ id, etiqueta }))
            .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));

        this.vehiculos.set(aOpciones(vehiculos));
        this.conductores.set(aOpciones(conductores));
      },
      // Sin opciones, el reporte sigue disponible por período.
      error: () => {
        this.vehiculos.set([]);
        this.conductores.set([]);
      },
    });
  }

  consultar(): void {
    if (!this.desde || !this.hasta || this.desde > this.hasta) {
      this.error.set('Seleccione un período válido: la fecha inicial no puede ser posterior a la final.');
      return;
    }

    const filtros: FiltrosReporteDto = {
      desde: this.desde,
      hasta: this.hasta,
      ...(this.vehiculoId ? { vehiculo_id: this.vehiculoId } : {}),
      ...(this.conductorId ? { conductor_id: this.conductorId } : {}),
    };

    const consulta: ConsultaAplicada = {
      desde: filtros.desde,
      hasta: filtros.hasta,
      ...(this.vehiculoId ? { vehiculo: this.etiqueta(this.vehiculos(), this.vehiculoId) } : {}),
      ...(this.conductorId ? { conductor: this.etiqueta(this.conductores(), this.conductorId) } : {}),
    };

    this.cargando.set(true);
    this.error.set(null);

    this.servicio.obtenerRentabilidad(filtros).subscribe({
      next: datos => {
        this.reporte.set(datos);
        this.consultaAplicada.set(consulta);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible consultar el reporte de rentabilidad.');
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltros(): void {
    this.vehiculoId = '';
    this.conductorId = '';
    this.consultar();
  }

  diferencia(margenEstimado: number, margenReal: number): number {
    return margenReal - margenEstimado;
  }

  interpretacion(margenEstimado: number, margenReal: number): string {
    const diferencia = margenReal - margenEstimado;

    if (diferencia < 0) {
      return 'Costo real mayor al previsto';
    }

    if (diferencia > 0) {
      return 'Costo real menor al previsto';
    }

    return 'Sin desviación';
  }

  private etiqueta(opciones: OpcionFiltro[], id: string): string {
    return opciones.find(o => o.id === id)?.etiqueta ?? id;
  }
}
