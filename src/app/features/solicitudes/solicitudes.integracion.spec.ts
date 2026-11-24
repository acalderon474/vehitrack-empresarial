import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Solicitudes } from './solicitudes';
import { environment } from '../../../environments/environment';

/**
 * Prueba de integración: la página completa con el servicio simulado
 * real (sin API configurada), como la verá el usuario al ejecutar
 * `npm start`.
 */
describe('Solicitudes (integración con datos simulados)', () => {

  let fixture: ComponentFixture<Solicitudes>;
  let component: Solicitudes;

  const urlOriginal = environment.apiBaseUrl;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;

  /** Espera el retardo del servicio simulado y refresca la pantalla. */
  async function esperar(): Promise<void> {
    await new Promise((resolver) => setTimeout(resolver, 450));
    fixture.detectChanges();
  }

  function cifras(): string[] {
    return Array.from(raiz().querySelectorAll('.tarjeta .cifra')).map((e) =>
      (e.textContent ?? '').trim(),
    );
  }

  function boton(etiqueta: string): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`);
  }

  beforeEach(async () => {
    environment.apiBaseUrl = '';

    await TestBed.configureTestingModule({
      imports: [Solicitudes],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Solicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await esperar();
  });

  afterEach(() => {
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe mostrar el título y las nueve solicitudes de ejemplo', () => {
    expect(raiz().querySelector('h1')?.textContent).toContain('Solicitudes de servicio');
    expect(raiz().querySelectorAll('tbody tr')).toHaveLength(9);
  });

  it('debe contar las solicitudes por estado', () => {
    // pendientes, asignadas, finalizadas, canceladas
    expect(cifras()).toEqual(['5', '2', '1', '1']);
  });

  it('debe mostrar el pie de datos ilustrativos', () => {
    expect(raiz().querySelector('.pie-simulado')?.textContent).toContain('Datos ilustrativos');
  });

  it('debe elegir por defecto la solicitud más próxima en el tiempo', () => {
    // SOL-2026-011 es la más antigua (finalizada, con recorrido R-7825).
    expect(raiz().querySelector('.detalle')?.textContent).toContain('SOL-2026-011');
    expect(raiz().querySelector('.nota-estado')?.textContent).toContain('ya finalizado');
    expect(raiz().textContent).toContain('R-7825');
  });

  it('debe actualizar los conteos y el listado al cancelar una solicitud', async () => {
    boton('Cancelar la solicitud SOL-2026-014')?.click();
    fixture.detectChanges();

    component['listado']()!.motivo.setValue('Reprogramado por cliente');
    component['listado']()!.confirmarCancelacion();
    await esperar();
    await esperar();

    expect(raiz().textContent).toContain('La solicitud SOL-2026-014 fue cancelada.');
    expect(cifras()).toEqual(['4', '2', '1', '2']);
    expect(boton('Cancelar la solicitud SOL-2026-014')).toBeNull();
  });

  it('debe mostrar una solicitud registrada en el listado y en los conteos', async () => {
    component.alternarNueva();
    fixture.detectChanges();

    const formulario = raiz().querySelector('app-solicitud-formulario');
    expect(formulario).not.toBeNull();

    const entrada = (id: string, valor: string): void => {
      const campo = raiz().querySelector<HTMLInputElement>(`#${id}`)!;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
    };

    entrada('nombreCliente', 'Cliente de prueba');
    entrada('origenDireccion', 'Barranquilla');
    entrada('destinoDireccion', 'Cartagena');
    entrada('fechaHora', '2099-03-15T08:30');
    entrada('cantidadPasajeros', '4');
    entrada('tarifa', '500000');
    fixture.detectChanges();

    raiz().querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await esperar();
    await esperar();

    expect(raiz().textContent).toContain('Solicitud registrada');
    expect(raiz().textContent).toContain('SOL-2026-015');
    expect(raiz().querySelectorAll('tbody tr')).toHaveLength(10);
    expect(cifras()).toEqual(['6', '2', '1', '1']);
  });

  it('debe abrir la edición de una asignada con la ruta bloqueada', () => {
    boton('Editar la solicitud SOL-2026-013')?.click();
    fixture.detectChanges();

    expect(raiz().textContent).toContain('Editar solicitud SOL-2026-013');
    expect(raiz().querySelector('.aviso-bloqueo')).not.toBeNull();
    expect(raiz().querySelector<HTMLInputElement>('#cantidadPasajeros')?.disabled).toBe(true);
    expect(raiz().querySelector<HTMLInputElement>('#tarifa')?.disabled).toBe(false);
  });
});
