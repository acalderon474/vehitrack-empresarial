import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Reportes, formatearFecha, periodoInicial } from './reportes';
import { environment } from '../../../environments/environment';

describe('Reportes', () => {
  let component: Reportes;
  let fixture: ComponentFixture<Reportes>;
  let pantalla: HTMLElement;

  const urlOriginal = environment.apiBaseUrl;

  function resumenConsulta(): string {
    return pantalla.querySelector('.resumen-consulta')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  beforeEach(async () => {
    environment.apiBaseUrl = '';

    await TestBed.configureTestingModule({
      imports: [Reportes],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reportes);
    component = fixture.componentInstance;
    pantalla = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    environment.apiBaseUrl = urlOriginal;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar los datos de demostración con las fechas predeterminadas', () => {
    expect(component.desde).toBe('2026-11-01');
    expect(component.recorridos().length).toBe(10);

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

  it('debe mostrar el período realmente consultado', () => {
    expect(resumenConsulta()).toContain('10 recorridos cerrados');
    expect(resumenConsulta()).toContain('Período 01/11/2026 –');
  });

  it('no debe cambiar el período mostrado hasta consultar de nuevo', () => {
    component.desde = '2026-11-19';
    component.hasta = '2026-11-20';
    fixture.detectChanges();

    expect(resumenConsulta()).toContain('Período 01/11/2026 –');
    expect(resumenConsulta()).toContain('10 recorridos cerrados');

    component.consultar();
    fixture.detectChanges();

    expect(resumenConsulta()).toContain('1 recorrido cerrado ·');
    expect(resumenConsulta()).toContain('Período 19/11/2026 – 20/11/2026');
  });

  it('debe ofrecer los vehículos y conductores de los recorridos', () => {
    expect(component.vehiculos().length).toBe(6);
    expect(component.conductores().map(c => c.etiqueta)).toEqual([
      'Andrea Villalba (C-005)',
      'Carlos Pérez (C-001)',
      'Jorge Castañeda (C-004)',
      'Luis Herrera (C-002)',
      'Marta Ospina (C-003)',
      'Ricardo Mejía (C-006)',
    ]);
  });

  it('debe filtrar el reporte por conductor', () => {
    component.conductorId = 'con-004';
    component.consultar();
    fixture.detectChanges();

    expect(component.recorridos().map(r => r.codigo)).toEqual(['R-7822', 'R-7820']);
    expect(component.margenRegistrado()).toBe(165000);
    expect(resumenConsulta()).toContain('Conductor Jorge Castañeda (C-004)');
  });

  it('debe filtrar el reporte por vehículo', () => {
    component.vehiculoId = 'veh-103';
    component.consultar();
    fixture.detectChanges();

    expect(component.recorridos().map(r => r.codigo)).toEqual(['R-7825', 'R-7819']);
    expect(resumenConsulta()).toContain('Vehículo QAZ-118');
  });

  it('debe limpiar los filtros y volver al reporte completo', () => {
    component.conductorId = 'con-004';
    component.consultar();
    component.limpiarFiltros();

    expect(component.recorridos().length).toBe(10);
    expect(component.consultaAplicada()?.conductor).toBeUndefined();
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

  it('debe rechazar un período inválido sin cambiar el reporte mostrado', () => {
    component.desde = '2026-11-30';
    component.hasta = '2026-11-01';
    component.consultar();

    expect(component.error()).toContain('período válido');
    expect(component.consultaAplicada()?.desde).toBe('2026-11-01');
  });

  it('debe indicar cuando no hay recorridos con los filtros', () => {
    component.desde = '2026-10-01';
    component.hasta = '2026-10-31';
    component.consultar();
    fixture.detectChanges();

    expect(pantalla.textContent).toContain('No hay recorridos cerrados');
  });
});

describe('Fechas del reporte', () => {

  it('debe formatear fechas ISO como día/mes/año', () => {
    expect(formatearFecha('2026-11-01')).toBe('01/11/2026');
  });

  it('con datos de prueba debe cubrir los cierres de demostración', () => {
    expect(periodoInicial(true, new Date(2026, 10, 10)))
      .toEqual({ desde: '2026-11-01', hasta: '2026-11-20' });
  });

  it('con datos de prueba en una fecha posterior debe seguir incluyéndolos', () => {
    expect(periodoInicial(true, new Date(2027, 2, 15)))
      .toEqual({ desde: '2026-11-01', hasta: '2027-03-15' });
  });

  it('con API debe usar el mes en curso', () => {
    expect(periodoInicial(false, new Date(2027, 2, 15)))
      .toEqual({ desde: '2027-03-01', hasta: '2027-03-15' });
  });
});
