import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CopPipe } from '../../core/pipes/cop.pipe';
import { ReporteService } from '../../core/services/reporte.service';
import { apiConfigurada } from '../../core/utils/respuesta-api';

import type { ReporteRentabilidadDto } from '../../core/dto/reporte.dto';

interface MargenPorVehiculo {
  placa: string;
  margen: number;
  porcentajeAltura: number;
}

function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Component({
  imports: [FormsModule, CopPipe],
  selector: 'app-reportes',
  styleUrl: './reportes.scss',
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {

  private readonly servicio = inject(ReporteService);

  readonly datosDePrueba = !apiConfigurada();

  desde = fechaIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  hasta = fechaIso(new Date());

  readonly reporte = signal<ReporteRentabilidadDto | null>(null);
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

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    if (!this.desde || !this.hasta || this.desde > this.hasta) {
      this.error.set('Seleccione un período válido: la fecha inicial no puede ser posterior a la final.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.servicio.obtenerRentabilidad({ desde: this.desde, hasta: this.hasta })
      .subscribe({
        next: datos => {
          this.reporte.set(datos);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No fue posible consultar el reporte de rentabilidad.');
          this.cargando.set(false);
        },
      });
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
}
