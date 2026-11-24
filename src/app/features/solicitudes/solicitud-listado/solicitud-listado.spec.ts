
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SolicitudListado } from './solicitud-listado';
import { SolicitudService } from '../../../core/services/solicitud.service';

import type {
    ListadoSolicitudes,
    SolicitudResumen
} from '../../../core/models/solicitud-resumen';

describe('SolicitudListado', () => {

    let fixture: ComponentFixture<SolicitudListado>;
    let component: SolicitudListado;
    let listar: ReturnType<typeof vi.fn>;
    let cambiarEstado: ReturnType<typeof vi.fn>;

    const pendiente: SolicitudResumen = {
        id: 'id-14',
        codigo: 'SOL-2026-014',
        nombreCliente: 'Clínica Portoazul',
        fechaHora: '2026-11-25T12:00:00Z',
        origen: { direccion: 'Barranquilla' },
        destino: { direccion: 'Cartagena' },
        cantidadPasajeros: 12,
        tarifa: 650000,
        estado: 'pendiente'
    };

    const asignada: SolicitudResumen = {
        id: 'id-13',
        codigo: 'SOL-2026-013',
        nombreCliente: 'Hotel El Prado',
        cantidadPasajeros: 10,
        tarifa: 180000,
        estado: 'asignada'
    };

    const finalizada: SolicitudResumen = {
        id: 'id-11',
        codigo: 'SOL-2026-011',
        nombreCliente: 'Hotel Puerto Real',
        cantidadPasajeros: 3,
        tarifa: 110000,
        estado: 'finalizada'
    };

    const cancelada: SolicitudResumen = {
        id: 'id-9',
        codigo: 'SOL-2026-009',
        nombreCliente: 'Familia Rodríguez',
        cantidadPasajeros: 5,
        tarifa: 130000,
        estado: 'cancelada',
        motivoCancelacion: 'Cambio de vuelo del cliente'
    };

    const listado: ListadoSolicitudes = {
        elementos: [pendiente, asignada, finalizada, cancelada],
        total: 4
    };

    const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;

    function botones(texto: string): HTMLButtonElement[] {
        return Array.from(raiz().querySelectorAll<HTMLButtonElement>('button'))
            .filter(b => (b.textContent ?? '').trim() === texto);
    }

    function botonPorEtiqueta(etiqueta: string): HTMLButtonElement | null {
        return raiz().querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`);
    }

    beforeEach(async () => {
        listar = vi.fn().mockReturnValue(of(listado));
        cambiarEstado = vi.fn().mockReturnValue(of(undefined));

        await TestBed.configureTestingModule({
            imports: [SolicitudListado],
            providers: [
                provideRouter([]),
                {
                    provide: SolicitudService,
                    useValue: { listar, cambiarEstado, usaDatosSimulados: false }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SolicitudListado);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('debe cargar y mostrar las solicitudes al iniciar', () => {

        expect(listar).toHaveBeenCalledTimes(1);
        expect(listar).toHaveBeenCalledWith({});

        const filas = raiz().querySelectorAll('tbody tr');
        const contenido = raiz().textContent ?? '';

        expect(filas).toHaveLength(4);
        expect(contenido).toContain('SOL-2026-014');
        expect(contenido).toContain('Clínica Portoazul');
        expect(contenido).toContain('Barranquilla → Cartagena');
        expect(contenido).toContain('Mostrando 4 de 4 solicitudes');
    });

    it('debe mostrar un guion cuando el backend no envía un dato', () => {

        // La solicitud asignada no tiene fecha, ruta ni recorrido.
        const fila = raiz().querySelectorAll('tbody tr')[1] as HTMLElement;

        // Primera celda (th): código y cliente. Después: ruta, fecha,
        // pasajeros, tarifa, estado, recorrido y acciones.
        const celdas = fila.querySelectorAll('td');

        expect(fila.querySelector('th')?.textContent).toContain('SOL-2026-013');
        expect(fila.querySelector('th')?.textContent).toContain('Hotel El Prado');
        expect(celdas[0]?.textContent?.trim()).toBe('—');
        expect(celdas[1]?.textContent?.trim()).toBe('—');
        expect(celdas[5]?.textContent?.trim()).toBe('—');
    });

    it('debe mostrar el estado vacío cuando no hay solicitudes', () => {

        listar.mockReturnValue(of({ elementos: [], total: 0 }));
        component.recargar();
        fixture.detectChanges();

        expect(raiz().querySelector('table')).toBeNull();
        expect(raiz().textContent).toContain('No hay solicitudes que coincidan');
    });

    it('debe mostrar el error de carga y permitir reintentar', () => {

        listar.mockReturnValueOnce(
            throwError(() => new HttpErrorResponse({ status: 0 }))
        );
        component.recargar();
        fixture.detectChanges();

        expect(raiz().textContent).toContain('No se pudo conectar con el servidor');
        expect(raiz().querySelector('table')).toBeNull();

        botones('Reintentar')[0]?.click();
        fixture.detectChanges();

        expect(raiz().querySelectorAll('tbody tr')).toHaveLength(4);
        expect(component.error()).toBeNull();
    });

    it('debe enviar al backend los filtros de estado y fecha', () => {

        listar.mockClear();

        component.filtros.patchValue({ estado: 'pendiente' });
        expect(listar).toHaveBeenCalledWith({ estado: 'pendiente' });

        component.filtros.patchValue({ fecha: '2026-11-25' });
        expect(listar).toHaveBeenCalledWith({ estado: 'pendiente', fecha: '2026-11-25' });

        component.filtros.patchValue({ estado: '' });
        expect(listar).toHaveBeenCalledWith({ fecha: '2026-11-25' });
    });

    it('debe filtrar por cliente o código sin importar mayúsculas ni tildes', () => {

        component.textoCliente.set('clinica');
        fixture.detectChanges();
        expect(raiz().querySelectorAll('tbody tr')).toHaveLength(1);

        component.textoCliente.set('RODRIGUEZ');
        fixture.detectChanges();
        expect(raiz().querySelectorAll('tbody tr')).toHaveLength(1);
        expect(raiz().textContent).toContain('SOL-2026-009');

        component.textoCliente.set('sol-2026-01');
        fixture.detectChanges();
        expect(raiz().querySelectorAll('tbody tr')).toHaveLength(3);

        component.textoCliente.set('zzz');
        fixture.detectChanges();
        expect(raiz().textContent).toContain('No hay solicitudes que coincidan');
    });

    it('el filtro de cliente no debe volver a consultar el servidor', () => {

        listar.mockClear();

        component.textoCliente.set('prado');
        fixture.detectChanges();

        expect(listar).not.toHaveBeenCalled();
    });

    it('debe limpiar todos los filtros', () => {

        component.filtros.patchValue({ estado: 'asignada', fecha: '2026-11-25' });
        component.textoCliente.set('prado');
        listar.mockClear();

        component.limpiarFiltros();

        expect(component.textoCliente()).toBe('');
        expect(component.filtros.getRawValue()).toEqual({ estado: '', fecha: '' });
        expect(listar).toHaveBeenCalledWith({});
    });

    it('debe ofrecer editar y cancelar solo en solicitudes pendientes o asignadas', () => {

        expect(botonPorEtiqueta('Editar la solicitud SOL-2026-014')).not.toBeNull();
        expect(botonPorEtiqueta('Cancelar la solicitud SOL-2026-014')).not.toBeNull();
        expect(botonPorEtiqueta('Editar la solicitud SOL-2026-013')).not.toBeNull();
        expect(botonPorEtiqueta('Cancelar la solicitud SOL-2026-013')).not.toBeNull();

        expect(botonPorEtiqueta('Editar la solicitud SOL-2026-011')).toBeNull();
        expect(botonPorEtiqueta('Cancelar la solicitud SOL-2026-011')).toBeNull();
        expect(botonPorEtiqueta('Editar la solicitud SOL-2026-009')).toBeNull();
        expect(botonPorEtiqueta('Cancelar la solicitud SOL-2026-009')).toBeNull();
    });

    it('debe mostrar el motivo de una solicitud cancelada en su detalle', () => {

        component.seleccionar(cancelada);
        fixture.detectChanges();

        expect(raiz().querySelector('.nota-estado')?.textContent)
            .toContain('Cambio de vuelo del cliente');
    });

    it('debe emitir la solicitud al pedir editar', () => {

        const emitidas: SolicitudResumen[] = [];
        component.editar.subscribe(s => emitidas.push(s));

        botonPorEtiqueta('Editar la solicitud SOL-2026-014')?.click();

        expect(emitidas).toEqual([pendiente]);
    });


    describe('tarjetas de conteo', () => {

        function cifras(): string[] {
            return Array.from(raiz().querySelectorAll('.tarjeta .cifra'))
                .map(e => (e.textContent ?? '').trim());
        }

        it('debe mostrar cuántas solicitudes hay en cada estado', () => {

            expect(cifras()).toEqual(['1', '1', '1', '1']);

            const titulos = Array.from(raiz().querySelectorAll('.tarjeta h3'))
                .map(e => (e.textContent ?? '').trim());

            expect(titulos).toEqual([
                'Pendientes',
                'Asignadas',
                'Finalizadas (recientes)',
                'Canceladas (recientes)'
            ]);
        });

        it('debe contar varias solicitudes del mismo estado', () => {

            listar.mockReturnValue(of({
                elementos: [pendiente, { ...pendiente, id: 'x', codigo: 'SOL-X' }, asignada],
                total: 3
            }));
            component.recargar();
            fixture.detectChanges();

            expect(cifras()).toEqual(['2', '1', '0', '0']);
        });

        it('no debe cambiar los conteos al filtrar y debe consultarlos sin filtros', () => {

            listar.mockImplementation((filtros: { estado?: string }) =>
                of(filtros.estado === 'pendiente'
                    ? { elementos: [pendiente], total: 1 }
                    : listado));

            listar.mockClear();
            component.filtros.patchValue({ estado: 'pendiente' });
            fixture.detectChanges();

            expect(listar).toHaveBeenCalledWith({ estado: 'pendiente' });
            expect(listar).toHaveBeenCalledWith({});
            expect(raiz().querySelectorAll('tbody tr')).toHaveLength(1);
            expect(cifras()).toEqual(['1', '1', '1', '1']);
        });

        it('debe conservar los conteos anteriores si falla la consulta sin filtros', () => {

            listar.mockImplementation((filtros: { estado?: string }) =>
                filtros.estado === 'pendiente'
                    ? of({ elementos: [pendiente], total: 1 })
                    : throwError(() => new HttpErrorResponse({ status: 500 })));

            component.filtros.patchValue({ estado: 'pendiente' });
            fixture.detectChanges();

            expect(cifras()).toEqual(['1', '1', '1', '1']);
            expect(component.error()).toBeNull();
        });
    });

    describe('detalle de la solicitud', () => {

        const detalle = (): HTMLElement | null => raiz().querySelector('.detalle');

        it('debe mostrar por defecto el detalle de la primera solicitud', () => {

            expect(detalle()?.textContent).toContain('Detalle de la solicitud SOL-2026-014');
            expect(detalle()?.textContent).toContain('Clínica Portoazul');
        });

        it('debe mostrar los seis datos del diseño con su formato', () => {

            const texto = detalle()?.textContent ?? '';

            expect(texto).toContain('Barranquilla');
            expect(texto).toContain('Cartagena');
            expect(texto).toContain('25/11/2026 · 07:00');
            expect(texto).toContain('12 pasajeros');
            expect(texto).toContain('$650.000 COP');
            expect(texto).toContain('Referencia');
        });

        it('debe usar el singular con un solo pasajero', () => {

            listar.mockReturnValue(of({
                elementos: [{ ...pendiente, cantidadPasajeros: 1 }],
                total: 1
            }));
            component.recargar();
            fixture.detectChanges();

            expect(detalle()?.textContent).toContain('1 pasajero');
            expect(detalle()?.textContent).not.toContain('1 pasajeros');
        });

        it('debe cambiar el detalle al elegir otra fila', () => {

            const boton = raiz().querySelector<HTMLButtonElement>(
                'button[aria-label="Ver el detalle de la solicitud SOL-2026-011"]'
            );
            boton?.click();
            fixture.detectChanges();

            expect(detalle()?.textContent).toContain('Detalle de la solicitud SOL-2026-011');
            expect(raiz().querySelectorAll('tbody tr.elegida')).toHaveLength(1);
        });

        it('debe elegir la fila al pulsar cualquier parte de ella', () => {

            const fila = raiz().querySelectorAll<HTMLElement>('tbody tr')[3];
            fila?.click();
            fixture.detectChanges();

            expect(detalle()?.textContent).toContain('SOL-2026-009');
        });

        it('debe volver a la primera solicitud si la elegida deja de verse', () => {

            component.seleccionar(cancelada);
            fixture.detectChanges();
            expect(detalle()?.textContent).toContain('SOL-2026-009');

            component.textoCliente.set('portoazul');
            fixture.detectChanges();

            expect(detalle()?.textContent).toContain('SOL-2026-014');
        });

        it('no debe mostrar el detalle si no hay solicitudes', () => {

            listar.mockReturnValue(of({ elementos: [], total: 0 }));
            component.recargar();
            fixture.detectChanges();

            expect(detalle()).toBeNull();
        });

        it('debe explicar qué se puede hacer según el estado', () => {

            const nota = (): string =>
                raiz().querySelector('.nota-estado')?.textContent?.trim() ?? '';

            expect(nota()).toContain('Pendiente de asignación');

            component.seleccionar(asignada);
            fixture.detectChanges();
            expect(nota()).toContain('asignación vigente');
            expect(nota()).toContain('bloqueados para edición');

            component.seleccionar(finalizada);
            fixture.detectChanges();
            expect(nota()).toBe('Registro de referencia ya finalizado; bloqueado para edición de ruta.');

            component.seleccionar(cancelada);
            fixture.detectChanges();
            expect(nota()).toBe('Solicitud cancelada (Cambio de vuelo del cliente); bloqueada para edición.');

            // Una cancelada sin motivo registrado.
            const { motivoCancelacion: _motivo, ...sinMotivo } = cancelada;
            listar.mockReturnValue(of({ elementos: [sinMotivo], total: 1 }));
            component.recargar();
            fixture.detectChanges();
            expect(nota()).toBe('Solicitud cancelada; bloqueada para edición.');
        });

        describe('botón hacia Asignaciones', () => {

            function botonAsignacion(): HTMLButtonElement | undefined {
                return Array.from(raiz().querySelectorAll<HTMLButtonElement>('.pie-detalle button'))
                    .at(0);
            }

            it('debe ofrecer las recomendaciones si está pendiente', () => {
                expect(botonAsignacion()?.textContent?.trim()).toBe('Ver recomendaciones');
            });

            it('debe ofrecer el historial si está asignada o finalizada', () => {

                component.seleccionar(asignada);
                fixture.detectChanges();
                expect(botonAsignacion()?.textContent?.trim()).toBe('Ver historial');

                component.seleccionar(finalizada);
                fixture.detectChanges();
                expect(botonAsignacion()?.textContent?.trim()).toBe('Ver historial');
            });

            it('no debe ofrecer nada si está cancelada', () => {

                component.seleccionar(cancelada);
                fixture.detectChanges();

                expect(botonAsignacion()).toBeUndefined();
            });

            it('debe navegar a Asignaciones con el identificador de la solicitud', () => {

                const router = TestBed.inject(Router);
                const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

                botonAsignacion()?.click();

                expect(navegar).toHaveBeenCalledWith(['/asignaciones'], {
                    queryParams: { solicitud: 'id-14' }
                });
            });
        });
    });

    describe('tabla (diseño)', () => {

        it('debe tener las columnas del diseño y la de acciones', () => {

            const columnas = Array.from(raiz().querySelectorAll('thead th'))
                .map(e => (e.textContent ?? '').trim());

            expect(columnas).toEqual([
                'Solicitud', 'Ruta', 'Fecha · Hora', 'Pasajeros',
                'Tarifa', 'Estado', 'Recorrido', 'Acciones'
            ]);
        });

        it('debe mostrar fecha corta, tarifa con puntos y código del cliente', () => {

            const fila = raiz().querySelectorAll('tbody tr')[0] as HTMLElement;
            const celdas = Array.from(fila.querySelectorAll('td'))
                .map(e => (e.textContent ?? '').trim());

            expect(celdas[0]).toBe('Barranquilla → Cartagena');
            expect(celdas[1]).toBe('25/11 · 07:00');
            expect(celdas[2]).toBe('12');
            expect(celdas[3]).toBe('$650.000');
            expect(celdas[4]).toBe('Pendiente');
            expect(fila.querySelector('th .cliente')?.textContent).toContain('Clínica Portoazul');
        });

        it('debe mostrar el código del recorrido cuando existe', () => {

            listar.mockReturnValue(of({
                elementos: [{ ...finalizada, codigoRecorrido: 'R-7825' }],
                total: 1
            }));
            component.recargar();
            fixture.detectChanges();

            const celdas = raiz().querySelectorAll('tbody tr td');
            expect(celdas[5]?.textContent?.trim()).toBe('R-7825');
        });

        it('debe formatear las tarifas pequeñas con separador de miles', () => {
            expect(component.formatoCop(9500)).toBe('$9.500');
            expect(component.formatoCop(95000)).toBe('$95.000');
            expect(component.formatoCop(1350000)).toBe('$1.350.000');
            expect(component.formatoCop(0)).toBe('$0');
        });

        it('debe usar la hora de Colombia en las fechas', () => {

            // 2026-11-25T12:00:00Z son las 07:00 en Colombia (UTC-5).
            expect(component.fechaCorta(pendiente)).toBe('25/11 · 07:00');
            expect(component.fechaLarga(pendiente)).toBe('25/11/2026 · 07:00');

            // Medianoche en Colombia: debe ser 00:00 y no 24:00.
            const medianoche = { ...pendiente, fechaHora: '2026-11-26T05:00:00Z' };
            expect(component.fechaCorta(medianoche)).toBe('26/11 · 00:00');
        });
    });

    describe('notas informativas', () => {

        it('debe recordar los cuatro estados y que "en curso" es del recorrido', () => {
            expect(raiz().querySelector('.nota-informativa')?.textContent).toContain('pendiente, asignada, finalizada y cancelada');
            expect(raiz().querySelector('.nota-informativa')?.textContent).toContain('En curso');
        });

        it('no debe mostrar el pie de datos ilustrativos con la API real', () => {
            expect(raiz().querySelector('.pie-simulado')).toBeNull();
        });
    });

    describe('cancelación', () => {

        function abrirCancelacion(etiqueta: string): void {
            botonPorEtiqueta(etiqueta)?.click();
            fixture.detectChanges();
        }

        it('debe abrir el panel con el código de la solicitud', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');

            expect(raiz().querySelector('[role="dialog"]')).not.toBeNull();
            expect(raiz().textContent).toContain('Cancelar la solicitud SOL-2026-014');
            expect(raiz().textContent).not.toContain('asignación vigente');
        });

        it('debe advertir que se libera el vehículo si está asignada', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-013');

            expect(raiz().textContent).toContain('asignación vigente');
        });

        it('no debe cancelar sin motivo y debe pedirlo', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');

            botones('Confirmar cancelación')[0]?.click();
            fixture.detectChanges();

            expect(cambiarEstado).not.toHaveBeenCalled();
            expect(raiz().textContent).toContain('Escribe el motivo de la cancelación.');
        });

        it('debe exigir un motivo de al menos 3 caracteres', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');

            component.motivo.setValue('ab');
            component.confirmarCancelacion();
            fixture.detectChanges();

            expect(cambiarEstado).not.toHaveBeenCalled();
            expect(raiz().textContent).toContain('al menos 3 caracteres');
        });

        it('debe cancelar con el motivo, avisar y recargar el listado', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');
            listar.mockClear();

            component.motivo.setValue('  Reprogramado por cliente  ');
            component.confirmarCancelacion();
            fixture.detectChanges();

            expect(cambiarEstado).toHaveBeenCalledWith('id-14', {
                estado: 'cancelada',
                motivo_cancelacion: 'Reprogramado por cliente'
            });
            expect(listar).toHaveBeenCalledTimes(1);
            expect(raiz().querySelector('[role="dialog"]')).toBeNull();
            expect(raiz().textContent).toContain('La solicitud SOL-2026-014 fue cancelada.');
        });

        it('debe mostrar el error y mantener el panel abierto si falla', () => {

            cambiarEstado.mockReturnValue(
                throwError(() => new HttpErrorResponse({ status: 409 }))
            );

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');
            component.motivo.setValue('Reprogramado por cliente');
            component.confirmarCancelacion();
            fixture.detectChanges();

            expect(raiz().querySelector('[role="dialog"]')).not.toBeNull();
            expect(raiz().textContent).toContain('ya no admite esta operación');
            expect(component.procesando()).toBe(false);
        });

        it('debe cerrar el panel con Volver sin cancelar', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');

            botones('Volver')[0]?.click();
            fixture.detectChanges();

            expect(raiz().querySelector('[role="dialog"]')).toBeNull();
            expect(cambiarEstado).not.toHaveBeenCalled();
        });

        it('debe limpiar el motivo al abrir el panel de otra solicitud', () => {

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');
            component.motivo.setValue('Motivo anterior');
            component.cerrarCancelacion();

            abrirCancelacion('Cancelar la solicitud SOL-2026-013');

            expect(component.motivo.value).toBe('');
        });

        it('no debe enviar dos cancelaciones mientras hay una en curso', () => {

            cambiarEstado.mockReturnValue(new (class {
                subscribe(): { unsubscribe(): void } {
                    return { unsubscribe: () => undefined };
                }
            })());

            abrirCancelacion('Cancelar la solicitud SOL-2026-014');
            component.motivo.setValue('Reprogramado por cliente');

            component.confirmarCancelacion();
            component.confirmarCancelacion();

            expect(cambiarEstado).toHaveBeenCalledTimes(1);
        });
    });
});
