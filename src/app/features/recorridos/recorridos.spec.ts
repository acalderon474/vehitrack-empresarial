import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Recorridos } from './recorridos';
import { environment } from '../../../environments/environment';

describe('Recorridos', () => {
  let component: Recorridos;
  let fixture: ComponentFixture<Recorridos>;
  let pantalla: HTMLElement;

  const urlOriginal = environment.apiBaseUrl;

  beforeEach(async () => {
    environment.apiBaseUrl = '';

    await TestBed.configureTestingModule({
      imports: [Recorridos],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Recorridos);
    component = fixture.componentInstance;
    pantalla = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar los indicadores y la tabla de recorridos', () => {
    const indicadores = pantalla.querySelectorAll('.indicador strong');

    expect(indicadores[0].textContent?.trim()).toBe('2');
    expect(indicadores[1].textContent?.trim()).toBe('10');
    expect(pantalla.querySelectorAll('tbody tr').length).toBe(12);
  });

  it('debe seleccionar al inicio el último recorrido cerrado', () => {
    expect(component.seleccionado()?.codigo).toBe('R-7825');
    expect(pantalla.textContent).toContain('Costo real R-7825');
  });

  it('debe mostrar la conciliación de un recorrido cerrado', () => {
    const cerrado = component.recorridos().find(r => r.codigo === 'R-7825')!;

    component.seleccionar(cerrado);
    fixture.detectChanges();

    expect(pantalla.textContent).toContain('Cierre detallado · R-7825');
    expect(pantalla.textContent).toContain('$56.000');
    expect(pantalla.textContent).toContain('+$5.000');
  });

  it('debe mostrar el formulario de cierre para un recorrido en curso', () => {
    const enCurso = component.recorridos().find(r => r.codigo === 'R-7826')!;

    component.seleccionar(enCurso);
    fixture.detectChanges();

    expect(pantalla.querySelector('form')).toBeTruthy();
    expect(pantalla.textContent).toContain('Registrar cierre · R-7826');
  });

  it('no debe registrar un cierre con valores negativos', () => {
    const enCurso = component.recorridos().find(r => r.codigo === 'R-7826')!;

    component.seleccionar(enCurso);
    component.formulario.controls.combustible.setValue(-1);
    component.registrarCierre();

    expect(component.resultadoCierre()).toBeNull();
    expect(component.seleccionado()?.estado).toBe('en_curso');
  });

  it('debe registrar el cierre y actualizar el recorrido', () => {
    const enCurso = component.recorridos().find(r => r.codigo === 'R-7826')!;

    component.seleccionar(enCurso);
    component.formulario.setValue({
      kilometrosRecorridos: 15,
      combustible: 20000,
      peajes: 5000,
      mantenimiento: 4000,
      conductor: 12000,
      otros: 2000,
      observaciones: 'Cierre de prueba',
    });
    component.registrarCierre();
    fixture.detectChanges();

    expect(component.resultadoCierre()?.costo_real).toBe(43000);
    expect(component.seleccionado()?.estado).toBe('finalizado');
    expect(component.cerrados()).toBe(11);
    expect(pantalla.textContent).toContain('Cierre registrado');
  });
});
