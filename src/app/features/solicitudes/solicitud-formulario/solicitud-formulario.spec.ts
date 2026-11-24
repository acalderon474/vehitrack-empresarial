
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SolicitudFormulario } from './solicitud-formulario';
import { SolicitudService } from '../../../core/services/solicitud.service';

import type { NuevaSolicitud, Solicitud } from '../../../core/models/solicitud';

describe('SolicitudFormulario', () => {

    let fixture: ComponentFixture<SolicitudFormulario>;
    let component: SolicitudFormulario;
    let crear: ReturnType<typeof vi.fn>;

    // Fecha local futura, en el formato de <input type="datetime-local">.
    const FECHA_LOCAL = '2099-03-15T08:30';

    const solicitudCreada: Solicitud = {
        id: 'uuid-1',
        codigo: 'SOL-2026-015',
        nombreCliente: 'Hotel Caribe',
        origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
        destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
        fechaHora: new Date(FECHA_LOCAL).toISOString(),
        cantidadPasajeros: 12,
        tarifa: 650000,
        estado: 'pendiente',
        kmEstimados: 133.4,
        duracionEstimadaMin: 146
    };

    function llenarFormularioValido(): void {
        component.formulario.setValue({
            nombreCliente: '  Hotel Caribe  ',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fechaHora: FECHA_LOCAL,
            cantidadPasajeros: 12,
            tarifa: 650000
        });
    }

    function texto(): string {
        return (fixture.nativeElement as HTMLElement).textContent ?? '';
    }

    beforeEach(async () => {
        crear = vi.fn().mockReturnValue(of(solicitudCreada));

        await TestBed.configureTestingModule({
            imports: [SolicitudFormulario],
            providers: [
                { provide: SolicitudService, useValue: { crear } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SolicitudFormulario);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('debe crearse con el formulario vacío e inválido', () => {
        expect(component).toBeTruthy();
        expect(component.formulario.invalid).toBe(true);
        expect(texto()).toContain('Registrar solicitud de transporte');
    });

    it('no debe enviar si el formulario es inválido y debe mostrar los errores', () => {

        const boton = (fixture.nativeElement as HTMLElement)
            .querySelector<HTMLButtonElement>('button[type="submit"]');

        boton?.click();
        fixture.detectChanges();

        expect(crear).not.toHaveBeenCalled();
        expect(texto()).toContain('Este campo es obligatorio.');
    });

    it('debe rechazar espacios en blanco como cliente', () => {
        component.formulario.controls.nombreCliente.setValue('   ');
        expect(component.formulario.controls.nombreCliente.errors?.['noVacio']).toBe(true);
    });

    it('debe rechazar una fecha en el pasado', () => {
        component.formulario.controls.fechaHora.setValue('2020-01-01T08:00');
        expect(component.formulario.controls.fechaHora.errors?.['fechaPasada']).toBe(true);
    });

    it('debe validar pasajeros y tarifa', () => {

        const { cantidadPasajeros, tarifa } = component.formulario.controls;

        cantidadPasajeros.setValue(0);
        expect(cantidadPasajeros.errors?.['min']).toBeTruthy();

        cantidadPasajeros.setValue(101);
        expect(cantidadPasajeros.errors?.['max']).toBeTruthy();

        cantidadPasajeros.setValue(2.5);
        expect(cantidadPasajeros.errors?.['entero']).toBe(true);

        cantidadPasajeros.setValue(12);
        expect(cantidadPasajeros.valid).toBe(true);

        tarifa.setValue(-5);
        expect(tarifa.errors?.['min']).toBeTruthy();

        tarifa.setValue(650000.5);
        expect(tarifa.errors?.['entero']).toBe(true);

        tarifa.setValue(650000);
        expect(tarifa.valid).toBe(true);
    });

    it('debe exigir latitud y longitud juntas, o ninguna', () => {

        const { origen } = component.formulario.controls;

        origen.controls.lat.setValue(11.01);
        expect(origen.errors?.['coordenadasIncompletas']).toBe(true);

        origen.controls.lng.setValue(-74.82);
        expect(origen.errors).toBeNull();

        origen.controls.lat.setValue(null);
        origen.controls.lng.setValue(null);
        expect(origen.errors).toBeNull();
    });

    it('debe rechazar coordenadas fuera de rango', () => {

        const { destino } = component.formulario.controls;

        destino.controls.lat.setValue(91);
        destino.controls.lng.setValue(-181);

        expect(destino.controls.lat.errors?.['max']).toBeTruthy();
        expect(destino.controls.lng.errors?.['min']).toBeTruthy();
    });

    it('debe aceptar el cero como coordenada válida', () => {

        const { origen } = component.formulario.controls;

        origen.controls.lat.setValue(0);
        origen.controls.lng.setValue(0);

        expect(origen.errors).toBeNull();
        expect(origen.controls.lat.errors).toBeNull();
    });

    it('debe enviar la solicitud con los datos limpios y en formato ISO', () => {

        llenarFormularioValido();
        component.enviar();

        const esperado: NuevaSolicitud = {
            nombreCliente: 'Hotel Caribe',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fechaHora: new Date(FECHA_LOCAL).toISOString(),
            cantidadPasajeros: 12,
            tarifa: 650000
        };

        expect(crear).toHaveBeenCalledTimes(1);
        expect(crear).toHaveBeenCalledWith(esperado);
    });

    it('debe omitir las coordenadas cuando no se escriben', () => {

        llenarFormularioValido();
        component.formulario.controls.origen.patchValue({ lat: null, lng: null });
        component.enviar();

        const enviada = crear.mock.calls[0]?.[0] as NuevaSolicitud;

        expect(enviada.origen).toEqual({ direccion: 'Barranquilla' });
        expect('lat' in enviada.origen).toBe(false);
    });

    it('debe mostrar el resultado y emitir el evento al registrar', () => {

        const emitidas: Solicitud[] = [];
        component.registrada.subscribe(s => emitidas.push(s));

        llenarFormularioValido();
        component.enviar();
        fixture.detectChanges();

        expect(component.enviando()).toBe(false);
        expect(emitidas).toEqual([solicitudCreada]);

        const contenido = texto();

        expect(contenido).toContain('Solicitud registrada');
        expect(contenido).toContain('SOL-2026-015');
        expect(contenido).toContain('Pendiente');
        expect(contenido).toContain('133.4 km');
        expect(contenido).toContain('2 h 26 min');
    });

    it('debe explicar cuando no hay estimaciones por falta de coordenadas', () => {

        crear.mockReturnValue(of({
            ...solicitudCreada,
            kmEstimados: undefined,
            duracionEstimadaMin: undefined
        }));

        llenarFormularioValido();
        component.enviar();
        fixture.detectChanges();

        expect(texto()).toContain('faltan las coordenadas');
    });

    it('debe mostrar un mensaje claro si falla la conexión', () => {

        crear.mockReturnValue(
            throwError(() => new HttpErrorResponse({ status: 0 }))
        );

        llenarFormularioValido();
        component.enviar();
        fixture.detectChanges();

        expect(component.enviando()).toBe(false);
        expect(component.resultado()).toBeNull();
        expect(texto()).toContain('No se pudo conectar con el servidor');
    });

    it('debe distinguir el rechazo de datos y el error del servidor', () => {

        crear.mockReturnValueOnce(
            throwError(() => new HttpErrorResponse({ status: 422 }))
        );
        llenarFormularioValido();
        component.enviar();
        expect(component.error()).toContain('rechazó los datos');

        crear.mockReturnValueOnce(
            throwError(() => new HttpErrorResponse({ status: 500 }))
        );
        component.enviar();
        expect(component.error()).toContain('problema');
    });

    it('debe conservar lo escrito cuando hay un error, para reintentar', () => {

        crear.mockReturnValue(
            throwError(() => new HttpErrorResponse({ status: 500 }))
        );

        llenarFormularioValido();
        component.enviar();

        expect(component.formulario.controls.nombreCliente.value).toBe('  Hotel Caribe  ');
        expect(component.formulario.valid).toBe(true);
    });

    it('debe permitir registrar otra solicitud con el formulario limpio', () => {

        llenarFormularioValido();
        component.enviar();
        fixture.detectChanges();

        component.registrarOtra();
        fixture.detectChanges();

        expect(component.resultado()).toBeNull();
        expect(component.formulario.controls.nombreCliente.value).toBe('');
        expect(texto()).toContain('Registrar solicitud de transporte');
        expect(texto()).not.toContain('Solicitud registrada');
    });

    it('no debe enviar dos veces mientras hay un envío en curso', () => {

        crear.mockReturnValue(new (class {
            subscribe(): { unsubscribe(): void } {
                return { unsubscribe: () => undefined };
            }
        })());

        llenarFormularioValido();
        component.enviar();
        component.enviar();

        expect(crear).toHaveBeenCalledTimes(1);
        expect(component.enviando()).toBe(true);
    });

    it('debe formatear montos y duraciones', () => {
        expect(component.formatoDuracion(45)).toBe('45 min');
        expect(component.formatoDuracion(120)).toBe('2 h');
        expect(component.formatoDuracion(146)).toBe('2 h 26 min');
        expect(component.formatoCop(650000)).toContain('650');
    });
});
