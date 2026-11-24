import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlternativaVehiculo } from './alternativa-vehiculo';
import type { AlternativaAsignacion } from '../../../core/models/asignacion-flujo';

describe('AlternativaVehiculo', () => {
  let fixture: ComponentFixture<AlternativaVehiculo>;

  const base: AlternativaAsignacion = {
    vehiculoId: 'veh-103',
    placa: 'QAZ-118',
    kmVacios: 7,
    kmTotalesEstimados: 129.5,
    costoEstimado: 51000,
    margenProyectado: 69000,
    porcentajeMargen: 57.5,
    recomendado: true,
    explicacionCriterios: 'Mayor margen',
    capacidadPasajeros: 4,
    codigoVehiculo: 'V-103',
  };

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const texto = (): string => (raiz().textContent ?? '').replace(/\s+/g, ' ').trim();

  function crear(
    alternativa: AlternativaAsignacion,
    extra: Record<string, unknown> = {},
  ): void {
    fixture = TestBed.createComponent(AlternativaVehiculo);
    fixture.componentRef.setInput('alternativa', alternativa);
    fixture.componentRef.setInput('letra', 'B');
    for (const [nombre, valor] of Object.entries(extra)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlternativaVehiculo] }).compileComponents();
  });

  it('debe mostrar el vehículo como en el diseño', () => {
    crear(base);

    expect(texto()).toContain('Vehículo B · V-103');
    expect(texto()).toContain('Recomendado');
    expect(texto()).toContain('Placa QAZ-118 · 4 puestos · 7 km vacíos');
    expect(texto()).toContain('Costo total previsto');
    expect(texto()).toContain('$51.000');
    expect(texto()).toContain('Margen estimado: $69.000');
  });

  it('debe marcar una alternativa que no es la recomendada', () => {
    crear({ ...base, recomendado: false });

    expect(texto()).toContain('Alternativa');
    expect(texto()).not.toContain('Recomendado');
    expect(raiz().querySelector('.tarjeta.recomendada')).toBeNull();
  });

  it('debe usar la placa si no hay código interno', () => {
    const { codigoVehiculo: _codigo, ...sinCodigo } = base;
    crear(sinCodigo);

    expect(texto()).toContain('Vehículo B · QAZ-118');
  });

  it('no debe mostrar los puestos si el backend no los envía', () => {
    const { capacidadPasajeros: _puestos, ...sinPuestos } = base;
    crear(sinPuestos);

    expect(texto()).not.toContain('puestos');
    expect(texto()).toContain('Placa QAZ-118 · 7 km vacíos');
  });

  it('debe usar coma decimal en kilómetros y porcentaje', () => {
    crear({ ...base, kmVacios: 15.4, porcentajeMargen: 55.5 });

    expect(texto()).toContain('15,4 km vacíos');
    expect(texto()).toContain('(55,5 %)');
  });

  it('debe resaltar un margen negativo', () => {
    crear({ ...base, margenProyectado: -6885, porcentajeMargen: -6.26 });

    expect(texto()).toContain('Margen estimado: −$6.885');
    expect(raiz().querySelector('.margen.negativo')).not.toBeNull();
  });

  it('no debe ofrecer elegir en modo consulta', () => {
    crear(base);

    expect(raiz().querySelector('button')).toBeNull();
  });

  describe('modo elegir', () => {
    it('debe ofrecer elegir y emitir el identificador del vehículo', () => {
      crear(base, { modo: 'elegir' });

      const emitidos: string[] = [];
      fixture.componentInstance.elegir.subscribe((id) => emitidos.push(id));

      const boton = raiz().querySelector<HTMLButtonElement>('button');
      expect(boton?.textContent?.trim()).toBe('Elegir este vehículo');
      expect(boton?.getAttribute('aria-pressed')).toBe('false');

      boton?.click();
      expect(emitidos).toEqual(['veh-103']);
    });

    it('debe indicar cuál vehículo está elegido', () => {
      crear(base, { modo: 'elegir', elegida: true });

      const boton = raiz().querySelector<HTMLButtonElement>('button');
      expect(boton?.textContent?.trim()).toBe('Vehículo elegido');
      expect(boton?.getAttribute('aria-pressed')).toBe('true');
      expect(raiz().querySelector('.tarjeta.elegida')).not.toBeNull();
    });
  });

  it('debe marcar el vehículo con el que se confirmó la asignación', () => {
    crear(base, { confirmada: true });

    expect(texto()).toContain('Vehículo confirmado');
    expect(raiz().querySelector('.tarjeta.confirmada')).not.toBeNull();
  });
});
