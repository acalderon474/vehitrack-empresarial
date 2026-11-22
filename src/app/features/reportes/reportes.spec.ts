import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Reportes } from './reportes';
import { environment } from '../../../environments/environment';

describe('Reportes', () => {
  let component: Reportes;
  let fixture: ComponentFixture<Reportes>;
  let pantalla: HTMLElement;

  const urlOriginal = environment.apiBaseUrl;

  beforeEach(async () => {
    environment.apiBaseUrl = '';

    await TestBed.configureTestingModule({
      imports: [Reportes],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reportes);
    component = fixture.componentInstance;
    pantalla = fixture.nativeElement;

    component.desde = '2026-11-01';
    component.hasta = '2026-11-20';
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar los totales del período', () => {
    const indicadores = [...pantalla.querySelectorAll('.indicador strong')]
      .map(e => e.textContent?.trim());

    expect(indicadores).toEqual([
      '$1.350.000',
      '$698.000',
      '$711.000',
      '$652.000',
      '$639.000',
    ]);
  });

  it('debe agrupar el margen registrado por vehículo', () => {
    expect(component.porVehiculo().length).toBe(6);
    expect(component.porVehiculo().find(v => v.placa === 'WXS-934')?.margen)
      .toBe(165000);
  });

  it('debe listar la trazabilidad de los diez recorridos', () => {
    expect(pantalla.querySelectorAll('tbody tr').length).toBe(10);
    expect(component.variacionMargen()).toBe(-13000);
  });

  it('debe interpretar la diferencia de margen', () => {
    expect(component.interpretacion(69000, 64000)).toBe('Costo real mayor al previsto');
    expect(component.interpretacion(67000, 68000)).toBe('Costo real menor al previsto');
    expect(component.interpretacion(50000, 50000)).toBe('Sin desviación');
  });

  it('debe rechazar un período inválido', () => {
    component.desde = '2026-11-30';
    component.hasta = '2026-11-01';
    component.consultar();

    expect(component.error()).toContain('período válido');
  });

  it('debe indicar cuando no hay recorridos en el período', () => {
    component.desde = '2026-10-01';
    component.hasta = '2026-10-31';
    component.consultar();
    fixture.detectChanges();

    expect(pantalla.textContent).toContain('No hay recorridos cerrados');
  });
});
