import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
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

  /** La URL de la API se configura fuera de GitHub Pages, sin incluir secretos. */
  readonly demostracion = !environment.apiBaseUrl.trim();
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
