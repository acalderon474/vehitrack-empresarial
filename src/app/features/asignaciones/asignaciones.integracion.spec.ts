import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Asignaciones } from './asignaciones';
import { SolicitudService } from '../../core/services/solicitud.service';
import { environment } from '../../../environments/environment';

const SOL_14 = '00000000-0000-4000-8000-000000000014'; // pendiente, 12 pasajeros
const SOL_13 = '00000000-0000-4000-8000-000000000013'; // asignada
const SOL_11 = '00000000-0000-4000-8000-000000000011'; // finalizada

/**
 * Prueba de integración: la pantalla de Asignaciones con los servicios
 * simulados reales (sin API configurada), como la verá el usuario.
 */
describe('Asignaciones (integración con datos simulados)', () => {
  let fixture: ComponentFixture<Asignaciones>;
  let component: Asignaciones;
  let parametros: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const urlOriginal = environment.apiBaseUrl;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const texto = (): string => (raiz().textContent ?? '').replace(/\s+/g, ' ').trim();

  /** Espera el retardo del servicio simulado y refresca la pantalla. */
  async function esperar(): Promise<void> {
    await new Promise((resolver) => setTimeout(resolver, 450));
    fixture.detectChanges();
  }

  /**
   * Cargar una solicitud encadena dos consultas simuladas (la solicitud y
   * luego sus recomendaciones o su historial), así que se espera dos veces.
   */
  async function esperarCarga(): Promise<void> {
    await esperar();
    await esperar();
  }

  async function abrir(id: string | null): Promise<void> {
    parametros.next(convertToParamMap(id === null ? {} : { solicitud: id }));
    fixture.detectChanges();
    await esperarCarga();
  }

  function boton(etiqueta: string): HTMLButtonElement | undefined {
    return Array.from(raiz().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => (b.textContent ?? '').trim() === etiqueta,
    );
  }

  function elegirConductor(id: string): void {
    const select = raiz().querySelector<HTMLSelectElement>('#conductor')!;
    select.value = id;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    environment.apiBaseUrl = '';
    parametros = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [Asignaciones],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametros.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Asignaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await esperar();
  });

  afterEach(() => {
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe listar las cinco solicitudes pendientes de ejemplo', () => {
    expect(raiz().querySelectorAll('.lista-pendientes li')).toHaveLength(5);
  });

  it('debe comparar los vehículos de una solicitud pendiente', async () => {
    await abrir(SOL_14);

    const tarjetas = raiz().querySelectorAll('app-alternativa-vehiculo');

    expect(texto()).toContain('Solicitud SOL-2026-014');
    expect(tarjetas).toHaveLength(2);
    expect(tarjetas[0]?.textContent).toContain('Recomendado');
    expect(tarjetas[0]?.textContent).toContain('V-101');
    expect(texto()).toContain('aun incluyendo 15,4 km sin pasajeros');
  });

  it('debe confirmar la asignación y luego mostrar su historial', async () => {
    await abrir(SOL_14);

    elegirConductor('con-001');
    boton('Confirmar asignación')?.click();
    await esperar();

    expect(texto()).toContain('Asignación confirmada');
    expect(texto()).toContain('en_servicio');

    boton('Ver historial')?.click();
    await esperarCarga();

    expect(texto()).toContain('Historial de asignación SOL-2026-014');
    expect(texto()).toContain('Decisión registrada: V-101 + C-001');
    expect(texto()).toContain('servicio confirmado');
    expect(texto()).toContain('Margen registrado al cierre');
  });

  it('debe exigir motivo al elegir otra alternativa y registrarlo', async () => {
    await abrir(SOL_14);

    raiz().querySelectorAll<HTMLButtonElement>('app-alternativa-vehiculo button')[1]?.click();
    fixture.detectChanges();
    elegirConductor('con-001');

    boton('Confirmar asignación')?.click();
    fixture.detectChanges();
    expect(texto()).toContain('Indica por qué eliges un vehículo distinto del recomendado.');

    const motivo = raiz().querySelector<HTMLTextAreaElement>('#motivoSeleccion')!;
    motivo.value = 'El cliente pidió el microbús';
    motivo.dispatchEvent(new Event('input'));
    boton('Confirmar asignación')?.click();
    await esperar();
    boton('Ver historial')?.click();
    await esperarCarga();

    expect(texto()).toContain('Decisión registrada: V-103 + C-001');
    expect(texto()).toContain('Motivo: El cliente pidió el microbús');
  });

  it('debe explicar el conflicto si el conductor ya tiene un servicio cruzado', async () => {
    await abrir(SOL_14);

    // C-002 está asignado a SOL-2026-013, que se cruza con esta solicitud.
    elegirConductor('con-002');
    boton('Confirmar asignación')?.click();
    await esperar();

    expect(texto()).toContain('ya no están disponibles, o la solicitud cambió');
    expect(boton('Actualizar recomendaciones')).toBeDefined();
    expect(texto()).not.toContain('Asignación confirmada');
  });

  it('debe mostrar el historial de una asignación finalizada con su margen', async () => {
    await abrir(SOL_11);

    const cifras = Array.from(raiz().querySelectorAll('.cifras article')).map((a) => [
      (a.querySelector('h3')?.textContent ?? '').trim(),
      (a.querySelector('p')?.textContent ?? '').trim(),
    ]);

    expect(texto()).toContain('Recorrido vinculado: R-7825');
    expect(texto()).toContain('servicio finalizado');
    expect(cifras[2]).toEqual(['Diferencia de margen', '−$5.000']);
  });

  it('debe reflejar la cancelación de una solicitud asignada', async () => {
    const solicitudes = TestBed.inject(SolicitudService);

    await abrir(SOL_13);
    expect(texto()).toContain('Historial de asignación SOL-2026-013');

    await firstValueFrom(
      solicitudes.cambiarEstado(SOL_13, { estado: 'cancelada', motivo_cancelacion: 'Cambio de plan' }),
    );

    await abrir(SOL_13);
    expect(texto()).toContain('La solicitud está cancelada y no tiene asignación.');
  });

  it('debe llegar con el parámetro que envía el listado de solicitudes', async () => {
    expect(component.idSolicitud()).toBeNull();

    await abrir(SOL_14);

    expect(component.idSolicitud()).toBe(SOL_14);
  });
});
