import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Asignaciones } from './asignaciones';
import { AsignacionService } from '../../core/services/asignacion.service';
import { SolicitudService } from '../../core/services/solicitud.service';

import type {
  AlternativaAsignacion,
  ConductorDisponible,
  HistorialAsignacion,
  RecomendacionesAsignacion,
} from '../../core/models/asignacion-flujo';

import type { SolicitudResumen } from '../../core/models/solicitud-resumen';

describe('Asignaciones', () => {
  let fixture: ComponentFixture<Asignaciones>;
  let component: Asignaciones;
  let parametros: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  let obtener: ReturnType<typeof vi.fn>;
  let listar: ReturnType<typeof vi.fn>;
  let recomendar: ReturnType<typeof vi.fn>;
  let listarConductores: ReturnType<typeof vi.fn>;
  let confirmar: ReturnType<typeof vi.fn>;
  let obtenerHistorial: ReturnType<typeof vi.fn>;

  const pendiente: SolicitudResumen = {
    id: 'sol-14',
    codigo: 'SOL-2026-014',
    nombreCliente: 'Clínica Portoazul',
    origen: { direccion: 'Barranquilla' },
    destino: { direccion: 'Cartagena' },
    fechaHora: '2026-11-25T12:00:00Z',
    cantidadPasajeros: 12,
    tarifa: 650000,
    estado: 'pendiente',
  };

  const alternativaA: AlternativaAsignacion = {
    vehiculoId: 'veh-101',
    placa: 'KLA-452',
    codigoVehiculo: 'V-101',
    capacidadPasajeros: 15,
    kmVacios: 15.4,
    kmTotalesEstimados: 137.9,
    costoEstimado: 289256,
    margenProyectado: 360744,
    porcentajeMargen: 55.5,
    recomendado: true,
    explicacionCriterios: 'Mayor margen entre las alternativas elegibles.',
  };

  const alternativaB: AlternativaAsignacion = {
    ...alternativaA,
    vehiculoId: 'veh-103',
    placa: 'TRX-907',
    codigoVehiculo: 'V-103',
    capacidadPasajeros: 19,
    costoEstimado: 362474,
    margenProyectado: 287526,
    porcentajeMargen: 44.23,
    recomendado: false,
    explicacionCriterios: 'Margen $73.218 menor que V-101.',
  };

  const recomendaciones: RecomendacionesAsignacion = {
    solicitudId: 'sol-14',
    tarifaPactada: 650000,
    alternativas: [alternativaA, alternativaB],
  };

  const conductores: ConductorDisponible[] = [
    { id: 'con-001', codigo: 'C-001', nombreCompleto: 'Carlos Pérez', categoriaLicencia: 'C2', estado: 'disponible', vencimientoLicencia: '2028-05-10' },
    { id: 'con-006', codigo: 'C-006', nombreCompleto: 'Ricardo Mejía', categoriaLicencia: 'C2', estado: 'disponible', vencimientoLicencia: '2026-06-30' },
  ];

  const historial: HistorialAsignacion = {
    asignacionId: 'asg-1',
    solicitudId: 'sol-11',
    vehiculoElegidoId: 'veh-101',
    conductorId: 'con-001',
    conductorNombre: 'Carlos Pérez',
    conductorCodigo: 'C-001',
    motivoSeleccion: 'Recomendación óptima del sistema',
    esRecomendada: true,
    costoEstimado: 289256,
    margenPrevisto: 360744,
    margenRegistrado: 355744,
    codigoRecorrido: 'R-7825',
    estadoServicio: 'finalizado',
    alternativas: [alternativaA, alternativaB],
  };

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const texto = (): string => (raiz().textContent ?? '').replace(/\s+/g, ' ').trim();

  function boton(etiqueta: string): HTMLButtonElement | undefined {
    return Array.from(raiz().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => (b.textContent ?? '').trim() === etiqueta,
    );
  }

  /** Pares [título, cifra] de las tres tarjetas de margen del historial. */
  function cifras(): string[][] {
    return Array.from(raiz().querySelectorAll('.cifras article')).map((a) => [
      (a.querySelector('h3')?.textContent ?? '').trim(),
      (a.querySelector('p')?.textContent ?? '').trim(),
    ]);
  }

  function abrir(id: string | null): void {
    parametros.next(convertToParamMap(id === null ? {} : { solicitud: id }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    parametros = new BehaviorSubject(convertToParamMap({}));

    obtener = vi.fn().mockReturnValue(of(pendiente));
    listar = vi.fn().mockReturnValue(of({ elementos: [pendiente], total: 1 }));
    recomendar = vi.fn().mockReturnValue(of(recomendaciones));
    listarConductores = vi.fn().mockReturnValue(of(conductores));
    confirmar = vi.fn().mockReturnValue(
      of({ asignacionId: 'asg-1', estado: 'confirmada', costoEstimado: 289256, estadoVehiculo: 'en_servicio', estadoConductor: 'asignado' }),
    );
    obtenerHistorial = vi.fn().mockReturnValue(of(historial));

    await TestBed.configureTestingModule({
      imports: [Asignaciones],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametros.asObservable() } },
        { provide: SolicitudService, useValue: { obtener, listar } },
        {
          provide: AsignacionService,
          useValue: { recomendar, listarConductoresDisponibles: listarConductores, confirmar, obtenerHistorial },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Asignaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sin solicitud en la dirección', () => {
    it('debe listar las solicitudes pendientes', () => {
      expect(listar).toHaveBeenCalledWith({ estado: 'pendiente' });
      expect(raiz().querySelector('h1')?.textContent).toContain('Comparación y recomendación de vehículos');
      expect(texto()).toContain('Solicitudes pendientes de asignación');
      expect(texto()).toContain('SOL-2026-014');
      expect(texto()).toContain('Barranquilla → Cartagena · 12 pasajeros · tarifa $650.000');
    });

    it('no debe repetir el código en el resumen de la lista', () => {
      const resumen = raiz().querySelector('.lista-pendientes .resumen')?.textContent ?? '';
      expect(resumen).not.toContain('SOL-2026-014');
    });

    it('debe navegar a las recomendaciones de la solicitud elegida', () => {
      const router = TestBed.inject(Router);
      const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      boton('Ver recomendaciones')?.click();

      expect(navegar).toHaveBeenCalledWith(['/asignaciones'], { queryParams: { solicitud: 'sol-14' } });
    });

    it('debe avisar si no hay pendientes', () => {
      listar.mockReturnValue(of({ elementos: [], total: 0 }));
      abrir(null);
      component.abrir(null);
      fixture.detectChanges();

      expect(texto()).toContain('No hay solicitudes pendientes de asignación.');
    });
  });

  describe('solicitud pendiente (VT-012 y VT-013)', () => {
    beforeEach(() => abrir('sol-14'));

    it('debe pedir los datos de la solicitud, las recomendaciones y los conductores', () => {
      expect(obtener).toHaveBeenCalledWith('sol-14');
      expect(recomendar).toHaveBeenCalledWith('sol-14');
      expect(listarConductores).toHaveBeenCalledTimes(1);
    });

    it('debe mostrar el resumen de la solicitud y que está pendiente', () => {
      expect(texto()).toContain('Solicitud SOL-2026-014 · Barranquilla → Cartagena · 12 pasajeros · tarifa $650.000');
      expect(texto()).toContain('Pendiente');
      expect(texto()).toContain('el coordinador conserva la decisión final');
    });

    it('debe mostrar una tarjeta por alternativa con la recomendada primero', () => {
      const tarjetas = raiz().querySelectorAll('app-alternativa-vehiculo');

      expect(tarjetas).toHaveLength(2);
      expect(tarjetas[0]?.textContent).toContain('Vehículo A · V-101');
      expect(tarjetas[0]?.textContent).toContain('Recomendado');
      expect(tarjetas[1]?.textContent).toContain('Vehículo B · V-103');
      expect(tarjetas[1]?.textContent).toContain('Alternativa');
    });

    it('debe elegir por defecto la recomendada y explicarla', () => {
      expect(component.alternativaElegida()?.vehiculoId).toBe('veh-101');
      expect(texto()).toContain('V-101 (recomendado): Mayor margen entre las alternativas elegibles.');
      expect(texto()).toContain('Motivo de la selección (opcional)');
    });

    it('debe cambiar la explicación y exigir motivo al elegir otra alternativa', () => {
      raiz().querySelectorAll<HTMLButtonElement>('app-alternativa-vehiculo button')[1]?.click();
      fixture.detectChanges();

      expect(component.alternativaElegida()?.vehiculoId).toBe('veh-103');
      expect(texto()).toContain('V-103 (alternativa): Margen $73.218 menor que V-101.');
      expect(texto()).toContain('Motivo de la selección (obligatorio)');
    });

    it('no debe confirmar sin conductor y debe pedirlo', () => {
      boton('Confirmar asignación')?.click();
      fixture.detectChanges();

      expect(confirmar).not.toHaveBeenCalled();
      expect(texto()).toContain('Elige el conductor del servicio.');
    });

    it('no debe confirmar una alternativa distinta sin motivo', () => {
      component.elegirVehiculo('veh-103');
      component.conductorId.setValue('con-001');
      component.confirmar();
      fixture.detectChanges();

      expect(confirmar).not.toHaveBeenCalled();
      expect(texto()).toContain('Indica por qué eliges un vehículo distinto del recomendado.');
    });

    it('debe deshabilitar al conductor con la licencia vencida antes del servicio', () => {
      const opciones = Array.from(raiz().querySelectorAll<HTMLOptionElement>('#conductor option'));
      const ricardo = opciones.find((o) => o.textContent?.includes('Ricardo Mejía'));
      const carlos = opciones.find((o) => o.textContent?.includes('Carlos Pérez'));

      expect(ricardo?.disabled).toBe(true);
      expect(ricardo?.textContent).toContain('licencia vencida');
      expect(carlos?.disabled).toBe(false);
      expect(carlos?.textContent).toContain('C-001 · Carlos Pérez · Licencia C2');
    });

    it('debe impedir confirmar con un conductor de licencia vencida', () => {
      component.conductorId.setValue('con-006');
      component.confirmar();
      fixture.detectChanges();

      expect(confirmar).not.toHaveBeenCalled();
      expect(texto()).toContain('La licencia de este conductor está vencida.');
    });

    it('debe confirmar la recomendada con el contrato de la matriz', () => {
      component.conductorId.setValue('con-001');
      component.confirmar();
      fixture.detectChanges();

      expect(confirmar).toHaveBeenCalledWith({
        solicitudId: 'sol-14',
        vehiculoId: 'veh-101',
        conductorId: 'con-001',
        motivoSeleccion: '',
      });
      expect(texto()).toContain('Asignación confirmada');
      expect(texto()).toContain('$289.256');
      expect(boton('Confirmar asignación')).toBeUndefined();
    });

    it('debe confirmar otra alternativa con su motivo', () => {
      component.elegirVehiculo('veh-103');
      component.conductorId.setValue('con-001');
      component.motivo.setValue('  El cliente pidió el microbús  ');
      component.confirmar();

      expect(confirmar).toHaveBeenCalledWith({
        solicitudId: 'sol-14',
        vehiculoId: 'veh-103',
        conductorId: 'con-001',
        motivoSeleccion: 'El cliente pidió el microbús',
      });
    });

    it('debe explicar el conflicto y ofrecer actualizar las recomendaciones', () => {
      confirmar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      component.conductorId.setValue('con-001');
      component.confirmar();
      fixture.detectChanges();

      expect(texto()).toContain('ya no están disponibles, o la solicitud cambió');
      expect(component.confirmacion()).toBeNull();
      expect(component.confirmando()).toBe(false);

      recomendar.mockClear();
      boton('Actualizar recomendaciones')?.click();
      expect(recomendar).toHaveBeenCalledTimes(1);
    });

    it('no debe confirmar dos veces mientras hay una confirmación en curso', () => {
      confirmar.mockReturnValue(new (class {
        subscribe(): { unsubscribe(): void } {
          return { unsubscribe: () => undefined };
        }
      })());

      component.conductorId.setValue('con-001');
      component.confirmar();
      component.confirmar();

      expect(confirmar).toHaveBeenCalledTimes(1);
    });

    it('debe permitir ver el historial después de confirmar', () => {
      component.conductorId.setValue('con-001');
      component.confirmar();
      fixture.detectChanges();

      obtener.mockClear();
      boton('Ver historial')?.click();

      expect(obtener).toHaveBeenCalledWith('sol-14');
    });

    it('debe volver a la lista de solicitudes', () => {
      const router = TestBed.inject(Router);
      const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      boton('Volver a solicitudes')?.click();

      expect(navegar).toHaveBeenCalledWith(['/solicitudes']);
    });
  });

  describe('casos especiales', () => {
    it('debe explicar cuando ningún vehículo alcanza', () => {
      recomendar.mockReturnValue(of({ ...recomendaciones, alternativas: [] }));
      abrir('sol-14');

      expect(texto()).toContain('No hay vehículos disponibles con capacidad suficiente');
      expect(raiz().querySelector('app-alternativa-vehiculo')).toBeNull();
      expect(boton('Confirmar asignación')).toBeUndefined();
    });

    it('debe mostrar el error de carga y permitir reintentar', () => {
      obtener.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 0 })));
      abrir('sol-14');

      expect(texto()).toContain('No se pudo conectar con el servidor');

      boton('Reintentar')?.click();
      fixture.detectChanges();

      expect(raiz().querySelectorAll('app-alternativa-vehiculo')).toHaveLength(2);
    });

    it('debe avisar si la solicitud está cancelada', () => {
      obtener.mockReturnValue(of({ ...pendiente, estado: 'cancelada' }));
      abrir('sol-14');

      expect(texto()).toContain('La solicitud está cancelada y no tiene asignación.');
      expect(recomendar).not.toHaveBeenCalled();
      expect(obtenerHistorial).not.toHaveBeenCalled();
    });

    it('debe recargar al cambiar la solicitud de la dirección', () => {
      abrir('sol-14');
      recomendar.mockClear();

      abrir('sol-14');

      expect(recomendar).toHaveBeenCalledTimes(1);
    });
  });

  describe('historial de una asignación', () => {
    beforeEach(() => {
      obtener.mockReturnValue(of({ ...pendiente, id: 'sol-11', codigo: 'SOL-2026-011', estado: 'finalizada' }));
      abrir('sol-11');
    });

    it('debe pedir el historial y no las recomendaciones', () => {
      expect(obtenerHistorial).toHaveBeenCalledWith('sol-11');
      expect(recomendar).not.toHaveBeenCalled();
    });

    it('debe mostrar el recorrido vinculado y la asignación confirmada', () => {
      expect(texto()).toContain('Historial de asignación SOL-2026-011');
      expect(texto()).toContain('Recorrido vinculado: R-7825');
      expect(texto()).toContain('servicio finalizado');
      expect(texto()).toContain('Selección realizada por el coordinador');
      expect(texto()).toContain('Asignación confirmada');
    });

    it('debe marcar el vehículo confirmado y no ofrecer elegir', () => {
      expect(raiz().querySelectorAll('.tarjeta.confirmada')).toHaveLength(1);
      expect(raiz().querySelector('app-alternativa-vehiculo button')).toBeNull();
      expect(boton('Confirmar asignación')).toBeUndefined();
    });

    it('debe mostrar la decisión registrada', () => {
      expect(texto()).toContain('Decisión registrada: V-101 + C-001 · elección confirmada y servicio finalizado.');
      expect(texto()).toContain('V-101 confirmado');
    });

    it('debe mostrar el margen previsto, el registrado y la diferencia', () => {
      expect(cifras()).toEqual([
        ['Margen previsto de V-101', '$360.744'],
        ['Margen registrado al cierre', '$355.744'],
        ['Diferencia de margen', '−$5.000'],
      ]);
    });

    it('debe mostrar guiones si todavía no hay margen registrado', () => {
      const { margenRegistrado: _registrado, ...sinCierre } = historial;
      obtenerHistorial.mockReturnValue(of({ ...sinCierre, estadoServicio: 'confirmado' }));
      abrir('sol-11');
      component.abrir('sol-11');
      fixture.detectChanges();

      expect(cifras()).toEqual([
        ['Margen previsto de V-101', '$360.744'],
        ['Margen registrado al cierre', '—'],
        ['Diferencia de margen', '—'],
      ]);
      expect(texto()).not.toContain('y servicio finalizado');
    });

    it('debe mostrar el motivo cuando no se siguió la recomendación', () => {
      obtenerHistorial.mockReturnValue(of({
        ...historial,
        vehiculoElegidoId: 'veh-103',
        esRecomendada: false,
        motivoSeleccion: 'El cliente pidió el microbús',
      }));
      component.abrir('sol-11');
      fixture.detectChanges();

      expect(texto()).toContain('Motivo: El cliente pidió el microbús');
      expect(texto()).toContain('V-103 confirmado');
    });
  });
});
