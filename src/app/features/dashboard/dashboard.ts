import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import { RecorridoService } from '../../core/services/recorrido.service';
import { ReporteService } from '../../core/services/reporte.service';

import type { RecorridoSeguimiento } from '../../core/models/recorrido';
import type { ReporteRentabilidadDto } from '../../core/dto/reporte.dto';
import { environment } from '../../../environments/environment';
import type {
  IndicadoresDashboardDto,
  PeriodoFinanciero,
  ResumenFinancieroDashboardDto,
} from '../../core/dto/dashboard.dto';
import {
  CORTE_DEMOSTRACION,
  INICIO_DEMOSTRACION,
  cierresEntre,
  indicadoresDemostracion,
  margenPorVehiculoDemostracion,
  rangoFinancieroDemostracion,
  resumenFinancieroDemostracion,
} from '../../core/mocks/dashboard-demostracion';

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});

export function fechaColombia(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return [dia, mes, anio].join('/');
}

export function variacionMargen(resumen: ResumenFinancieroDashboardDto): number {
  return resumen.margen_real - resumen.margen_estimado;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly servicio = inject(DashboardService);
  private readonly servicioRecorridos = inject(RecorridoService);
  private readonly servicioReportes = inject(ReporteService);

  readonly demostracion = environment.modoDemostracion;
  readonly fechaCorte = CORTE_DEMOSTRACION;
  readonly formatoCOP = (valor: number) => formatoCOP.format(valor);
  readonly fechaColombia = fechaColombia;
  readonly periodos: { valor: PeriodoFinanciero; nombre: string }[] = [
    { valor: 'semana', nombre: 'Semana' },
    { valor: 'mes', nombre: 'Mes' },
    { valor: 'trimestre', nombre: 'Trimestre' },
  ];

  desde = INICIO_DEMOSTRACION;
  hasta = CORTE_DEMOSTRACION;
  periodo: PeriodoFinanciero = 'mes';

  readonly indicadores = signal<IndicadoresDashboardDto | null>(null);
  readonly finanzas = signal<ResumenFinancieroDashboardDto | null>(null);
  readonly consultaAplicada = signal<{ desde: string; hasta: string; periodo: PeriodoFinanciero } | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly actividadApi = signal<RecorridoSeguimiento[]>([]);

readonly margenesApi = signal<
  { placa: string; margen: number; porcentaje: number }[]
>([]);

readonly cargandoComplementos = signal(false);
readonly errorActividad = signal<string | null>(null);
readonly errorMargen = signal<string | null>(null);

private numeroConsulta = 0;

  readonly disponiblesPorcentaje = computed(() => {
    const datos = this.indicadores();
    return datos && datos.vehiculos_total > 0
      ? Math.round(datos.vehiculos_disponibles / datos.vehiculos_total * 100) : 0;
  });

  readonly variacion = computed(() => {
    const resumen = this.finanzas();
    return resumen ? variacionMargen(resumen) : 0;
  });

  readonly actividadDemostracion = computed(() => {
    const consulta = this.consultaAplicada();
    return consulta ? cierresEntre(consulta.desde, consulta.hasta).slice(0, 4) : [];
  });

  readonly vehiculosDemostracion = computed(() => {
    const consulta = this.consultaAplicada();
    const rango = rangoFinancieroDemostracion(consulta?.periodo ?? 'mes');
    return margenPorVehiculoDemostracion(cierresEntre(rango.desde, rango.hasta));
  });
  readonly rangoFinancieroDemostracion = rangoFinancieroDemostracion;

  ngOnInit(): void {
    if (!this.demostracion) {
      const hoy = new Date();
      const anio = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      this.desde = [anio, mes, '01'].join('-');
      this.hasta = [anio, mes, dia].join('-');
    }
    this.consultar();
  }

  consultar(): void {
    if (!this.desde || !this.hasta || this.desde > this.hasta) {
      this.error.set('El período de consulta no es válido. Revise las fechas inicial y final.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    const consulta = { desde: this.desde, hasta: this.hasta, periodo: this.periodo };

    const indicadores$ = this.demostracion
      ? of(indicadoresDemostracion(consulta.desde, consulta.hasta))
      : this.servicio.obtenerIndicadores({ desde: consulta.desde, hasta: consulta.hasta });
    const finanzas$ = this.demostracion
      ? of(resumenFinancieroDemostracion(consulta.periodo))
      : this.servicio.obtenerResumenFinanciero(consulta.periodo);

    forkJoin({ indicadores: indicadores$, finanzas: finanzas$ }).subscribe({
      next: ({ indicadores, finanzas }) => {
        this.indicadores.set(indicadores);
        this.finanzas.set(finanzas);
        this.consultaAplicada.set(consulta);
        this.cargando.set(false);


    // El escenario ilustrativo conserva su comportamiento.
    if (this.demostracion) {
      return;
    }

    const consultaActual = ++this.numeroConsulta;

    this.actividadApi.set([]);
    this.margenesApi.set([]);
    this.errorActividad.set(null);
    this.errorMargen.set(null);
    this.cargandoComplementos.set(true);

    // VT-014 y VT-015: consultas independientes de los KPIs.
    forkJoin({
      recorridos: this.servicioRecorridos.listar().pipe(
        catchError(() => {
          if (consultaActual === this.numeroConsulta) {
            this.errorActividad.set(
              'No fue posible consultar los recorridos.'
            );
          }
          return of([] as RecorridoSeguimiento[]);
        })
      ),

      reporte: this.servicioReportes.obtenerRentabilidad({
        desde: consulta.desde,
        hasta: consulta.hasta
      }).pipe(
        catchError(() => {
          if (consultaActual === this.numeroConsulta) {
            this.errorMargen.set(
              'No fue posible consultar la rentabilidad.'
            );
          }
          return of(null as ReporteRentabilidadDto | null);
        })
      )
    }).subscribe({
      next: ({ recorridos, reporte }) => {
        // Evitar que una consulta anterior reemplace la reciente.
        if (consultaActual !== this.numeroConsulta) {
          return;
        }

        const recientes = recorridos
          .filter(r =>
            r.estado === 'finalizado' &&
            !!r.fechaFin &&
            r.fechaFin.slice(0, 10) >= consulta.desde &&
            r.fechaFin.slice(0, 10) <= consulta.hasta
          )
          .sort((a, b) =>
            (b.fechaFin ?? '').localeCompare(a.fechaFin ?? '')
          )
          .slice(0, 4);

        this.actividadApi.set(recientes);

        // Agrupar márgenes reales por placa.
        const acumulados = new Map<string, number>();

        for (const r of reporte?.recorridos ?? []) {
          if (!r.placa || !Number.isFinite(r.margen_real)) {
            continue;
          }

          acumulados.set(
            r.placa,
            (acumulados.get(r.placa) ?? 0) + r.margen_real
          );
        }

        const maximo = Math.max(
          1,
          ...[...acumulados.values()].map(Math.abs)
        );

        const margenes = [...acumulados.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([placa, margen]) => ({
            placa,
            margen,
            porcentaje: Math.max(
              3,
              Math.round(Math.abs(margen) / maximo * 100)
            )
          }));

        this.margenesApi.set(margenes);
        this.cargandoComplementos.set(false);
      }
    });

      },
      error: () => {
        this.error.set('No fue posible consultar el Dashboard. Compruebe la conexión con la API empresarial.');
        this.cargando.set(false);
      },
    });
  }

  get recorridosEnRango(): number {
    const aplicado = this.consultaAplicada();
    return aplicado ? cierresEntre(aplicado.desde, aplicado.hasta).length : 0;
  }
}
