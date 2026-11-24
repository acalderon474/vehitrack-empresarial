import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CopPipe } from '../../core/pipes/cop.pipe';
import { RecorridoService } from '../../core/services/recorrido.service';
import { apiConfigurada } from '../../core/utils/respuesta-api';

import type { RecorridoSeguimiento } from '../../core/models/recorrido';
import type { ResultadoCierreRecorridoDto } from '../../core/dto/recorrido.dto';

@Component({
  imports: [ReactiveFormsModule, CopPipe],
  selector: 'app-recorridos',
  styleUrl: './recorridos.scss',
  templateUrl: './recorridos.html',
})
export class Recorridos implements OnInit {

  private readonly servicio = inject(RecorridoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly datosDePrueba = !apiConfigurada();

  readonly recorridos = signal<RecorridoSeguimiento[]>([]);
  readonly seleccionadoId = signal<string | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly resultadoCierre = signal<ResultadoCierreRecorridoDto | null>(null);

  readonly activos = computed(() =>
    this.recorridos().filter(r => r.estado === 'en_curso').length
  );

  readonly cerrados = computed(() =>
    this.recorridos().filter(r => r.estado === 'finalizado').length
  );

  readonly seleccionado = computed(() =>
    this.recorridos().find(r => r.id === this.seleccionadoId()) ?? null
  );

  readonly formulario = this.fb.group({
    kilometrosRecorridos: [0, [Validators.required, Validators.min(0)]],
    combustible: [0, [Validators.required, Validators.min(0)]],
    peajes: [0, [Validators.required, Validators.min(0)]],
    mantenimiento: [0, [Validators.required, Validators.min(0)]],
    conductor: [0, [Validators.required, Validators.min(0)]],
    otros: [0, [Validators.required, Validators.min(0)]],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(idASeleccionar?: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.servicio.listar().subscribe({
      next: lista => {
        this.recorridos.set(lista);
        const primerCerrado = lista.find(r => r.estado === 'finalizado');
        this.seleccionadoId.set(idASeleccionar ?? primerCerrado?.id ?? lista[0]?.id ?? null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible consultar los recorridos. Intente nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  seleccionar(recorrido: RecorridoSeguimiento): void {
    this.seleccionadoId.set(recorrido.id);
    this.resultadoCierre.set(null);
    this.error.set(null);
    this.formulario.reset();
  }

  registrarCierre(): void {
    const recorrido = this.seleccionado();

    if (!recorrido || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const observaciones = valores.observaciones.trim();

    this.guardando.set(true);
    this.error.set(null);

    this.servicio.cerrarGastos(recorrido.asignacionId, {
      kilometrosRecorridos: valores.kilometrosRecorridos,
      gastos: {
        combustible: valores.combustible,
        peajes: valores.peajes,
        mantenimiento: valores.mantenimiento,
        conductor: valores.conductor,
        otros: valores.otros,
      },
      ...(observaciones ? { observaciones } : {}),
    }).subscribe({
      next: resultado => {
        this.resultadoCierre.set(resultado);
        this.guardando.set(false);
        this.formulario.reset();
        this.cargar(recorrido.id);
      },
      error: () => {
        this.error.set('No fue posible registrar el cierre del recorrido.');
        this.guardando.set(false);
      },
    });
  }

  campoInvalido(nombre: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && control.touched;
  }
}
