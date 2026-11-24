import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Dashboard, fechaColombia, variacionMargen } from './dashboard';
import { environment } from '../../../environments/environment';
import {
  CIERRES_DEMOSTRACION,
  indicadoresDemostracion,
  resumenFinancieroDemostracion,
  margenPorVehiculoDemostracion,
  rangoFinancieroDemostracion,
} from '../../core/mocks/dashboard-demostracion';

describe('Dashboard - escenario académico', () => {
  const original = environment.apiBaseUrl;
  const modoOriginal = environment.modoDemostracion;

afterEach(() => {
  environment.apiBaseUrl = original;
  environment.modoDemostracion = modoOriginal;
});

  it('reproduce los diez cierres y los cinco KPIs del caso académico', () => {
    expect(indicadoresDemostracion('2026-11-01', '2026-11-20')).toEqual({
      vehiculos_total: 6,
      vehiculos_disponibles: 4,
      vehiculos_en_servicio: 2,
      solicitudes_pendientes: 1,
      recorridos_finalizados: 10,
    });
    expect(indicadoresDemostracion('2026-11-19', '2026-11-20').recorridos_finalizados).toBe(1);
  });

  it('concilia ingresos, costos y margen con Reportes', () => {
    expect(resumenFinancieroDemostracion('mes')).toEqual({
      ingreso_total: 1350000,
      costo_estimado: 698000,
      costo_real: 711000,
      margen_estimado: 652000,
      margen_real: 639000,
    });
    expect(variacionMargen(resumenFinancieroDemostracion('mes'))).toBe(-13000);
  });

  it('agrupa seis vehículos y respeta los registros del caso', () => {
    const datos = margenPorVehiculoDemostracion(CIERRES_DEMOSTRACION);
    expect(datos).toHaveLength(6);
    expect(datos.find(v => v.placa === 'WXS-934')?.margen).toBe(165000);
    expect(datos.find(v => v.placa === 'QAZ-118')?.margen).toBe(119000);
  });

  it('establece períodos de demostración explícitos', () => {
    expect(rangoFinancieroDemostracion('semana')).toEqual({ desde: '2026-11-14', hasta: '2026-11-20' });
    expect(rangoFinancieroDemostracion('trimestre')).toEqual({ desde: '2026-10-01', hasta: '2026-11-20' });
    expect(fechaColombia('2026-11-20')).toBe('20/11/2026');
  });

  it('renderiza el Dashboard y advierte que los datos son ilustrativos', async () => {
    environment.apiBaseUrl = '';
    environment.modoDemostracion = true;
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Resumen operativo');
    expect(fixture.nativeElement.textContent).toContain('Corte de los datos ilustrativos');
    expect(fixture.nativeElement.textContent).toContain('10');
    expect(fixture.nativeElement.textContent).toContain('639.000');
    expect(fixture.nativeElement.textContent).not.toContain('dashboard works!');
  });

  it('no altera los resultados al introducir fechas inválidas', async () => {
    environment.apiBaseUrl = '';
    environment.modoDemostracion = true;
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Dashboard);
    const componente = fixture.componentInstance;
    fixture.detectChanges();
    componente.desde = '2026-11-21';
    componente.hasta = '2026-11-01';
    componente.consultar();
    expect(componente.error()).toContain('no es válido');
    expect(componente.consultaAplicada()?.desde).toBe('2026-11-01');
  });

it('consume correctamente los contratos VT-004 y VT-005 de la API v2', async () => {
  environment.apiBaseUrl = 'https://api.test.local';
  environment.modoDemostracion = false;

  await TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting()
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Dashboard);
  const componente = fixture.componentInstance;
  const http = TestBed.inject(HttpTestingController);

  fixture.detectChanges();

  const rutaBase =
    'https://api.test.local/api/v2/enterprise/dashboard';

  const kpis = http.expectOne(
    `${rutaBase}/kpis?desde=${componente.desde}&hasta=${componente.hasta}`
  );

  const financiero = http.expectOne(
    `${rutaBase}/financial-summary?periodo=mes`
  );

  expect(kpis.request.method).toBe('GET');
  expect(financiero.request.method).toBe('GET');

  kpis.flush({
    errors: [],
    data: {
      vehiculos_total: 6,
      vehiculos_disponibles: 4,
      vehiculos_en_servicio: 2,
      solicitudes_pendientes: 1,
      recorridos_finalizados: 10
    }
  });

  financiero.flush({
    errors: [],
    data: resumenFinancieroDemostracion('mes')
  });

  fixture.detectChanges();

  expect(componente.indicadores()?.vehiculos_total).toBe(6);
  expect(componente.finanzas()?.margen_real).toBe(639000);
  expect(componente.demostracion).toBe(false);

  http.verify();
});
  });
