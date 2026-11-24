
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SolicitudFormulario } from './solicitud-formulario';
import { SolicitudService } from '../../../core/services/solicitud.service';

import type { SolicitudResumen } from '../../../core/models/solicitud-resumen';

describe('SolicitudFormulario (modo edición, VT-011)', () => {

    let fixture: ComponentFixture<SolicitudFormulario>;
    let component: SolicitudFormulario;
    let actualizar: ReturnType<typeof vi.fn>;
    let crear: ReturnType<typeof vi.fn>;

    const FECHA_ISO = '2099-03-15T13:30:00.000Z';

    const pendiente: SolicitudResumen = {
        id: 'id-14',
        codigo: 'SOL-2026-014',
        nombreCliente: 'Clínica Portoazul',
        fechaHora: FECHA_ISO,
        origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
        destino: { direccion: 'Cartagena' },
        cantidadPasajeros: 12,
        tarifa: 650000,
        estado: 'pendiente'
    };

    const asignada: SolicitudResumen = { ...pendiente, id: 'id-13', codigo: 'SOL-2026-013', estado: 'asignada' };

    const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;

    async function abrir(solicitud: SolicitudResumen): Promise<void> {

        crear = vi.fn();
        actualizar = vi.fn().mockReturnValue(of(undefined));

        await TestBed.configureTestingModule({
            imports: [SolicitudFormulario],
            providers: [
                { provide: SolicitudService, useValue: { crear, actualizar } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SolicitudFormulario);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('solicitudEditar', solicitud);
        fixture.detectChanges();
    }

    describe('solicitud pendiente', () => {

        beforeEach(async () => abrir(pendiente));

        it('debe mostrar el título de edición con el código', () => {
            expect(raiz().textContent).toContain('Editar solicitud SOL-2026-014');
            expect(raiz().textContent).toContain('Guardar cambios');
            expect(raiz().textContent).toContain('Cancelar edición');
        });

        it('debe cargar los datos de la solicitud', () => {

            const v = component.formulario.getRawValue();

            expect(v.nombreCliente).toBe('Clínica Portoazul');
            expect(v.origen).toEqual({ direccion: 'Barranquilla', lat: 11.01, lng: -74.82 });
            expect(v.destino).toEqual({ direccion: 'Cartagena', lat: null, lng: null });
            expect(v.cantidadPasajeros).toBe(12);
            expect(v.tarifa).toBe(650000);
            expect(new Date(v.fechaHora).toISOString()).toBe(FECHA_ISO);
        });

        it('debe dejar editables todos los campos y sin aviso de bloqueo', () => {

            expect(component.rutaBloqueada()).toBe(false);
            expect(component.formulario.controls.origen.enabled).toBe(true);
            expect(component.formulario.controls.fechaHora.enabled).toBe(true);
            expect(raiz().querySelector('.aviso-bloqueo')).toBeNull();
        });

        it('debe guardar todos los campos con el identificador de la solicitud', () => {

            const guardadas: undefined[] = [];
            component.guardada.subscribe(() => guardadas.push(undefined));

            component.formulario.controls.tarifa.setValue(700000);
            component.formulario.controls.nombreCliente.setValue('  Clínica Nueva  ');
            component.enviar();

            expect(crear).not.toHaveBeenCalled();
            expect(actualizar).toHaveBeenCalledTimes(1);
            expect(actualizar).toHaveBeenCalledWith('id-14', {
                nombreCliente: 'Clínica Nueva',
                origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
                destino: { direccion: 'Cartagena' },
                fechaHora: FECHA_ISO,
                cantidadPasajeros: 12,
                tarifa: 700000
            });
            expect(guardadas).toHaveLength(1);
            expect(component.enviando()).toBe(false);
        });

        it('debe seguir validando al editar', () => {

            component.formulario.controls.cantidadPasajeros.setValue(0);
            component.enviar();

            expect(actualizar).not.toHaveBeenCalled();
        });

        it('debe mostrar el error si el servidor rechaza el cambio', () => {

            actualizar.mockReturnValue(
                throwError(() => new HttpErrorResponse({ status: 409 }))
            );

            const guardadas: undefined[] = [];
            component.guardada.subscribe(() => guardadas.push(undefined));

            component.enviar();
            fixture.detectChanges();

            expect(guardadas).toHaveLength(0);
            expect(raiz().textContent).toContain('ya no admite esta operación');
            expect(component.enviando()).toBe(false);
        });

        it('debe emitir cerrado al cancelar la edición', () => {

            const cierres: undefined[] = [];
            component.cerrado.subscribe(() => cierres.push(undefined));

            const boton = Array.from(raiz().querySelectorAll<HTMLButtonElement>('button'))
                .find(b => (b.textContent ?? '').trim() === 'Cancelar edición');
            boton?.click();

            expect(cierres).toHaveLength(1);
        });
    });

    describe('solicitud con asignación vigente', () => {

        beforeEach(async () => abrir(asignada));

        it('debe bloquear la ruta, la fecha y los pasajeros y avisar', () => {

            expect(component.rutaBloqueada()).toBe(true);
            expect(component.formulario.controls.origen.disabled).toBe(true);
            expect(component.formulario.controls.destino.disabled).toBe(true);
            expect(component.formulario.controls.fechaHora.disabled).toBe(true);
            expect(component.formulario.controls.cantidadPasajeros.disabled).toBe(true);

            expect(component.formulario.controls.nombreCliente.enabled).toBe(true);
            expect(component.formulario.controls.tarifa.enabled).toBe(true);

            expect(raiz().querySelector('.aviso-bloqueo')).not.toBeNull();
            expect(raiz().textContent).toContain('asignación vigente');
        });

        it('debe deshabilitar los campos bloqueados en pantalla', () => {

            const origen = raiz().querySelector<HTMLInputElement>('#origenDireccion');
            const pasajeros = raiz().querySelector<HTMLInputElement>('#cantidadPasajeros');
            const tarifa = raiz().querySelector<HTMLInputElement>('#tarifa');

            expect(origen?.disabled).toBe(true);
            expect(pasajeros?.disabled).toBe(true);
            expect(tarifa?.disabled).toBe(false);
        });

        it('debe enviar solo el cliente y la tarifa', () => {

            component.formulario.controls.tarifa.setValue(690000);
            component.enviar();

            expect(actualizar).toHaveBeenCalledWith('id-13', {
                nombreCliente: 'Clínica Portoazul',
                tarifa: 690000
            });
        });
    });

    describe('solicitud con pocos datos (listado mínimo del backend)', () => {

        beforeEach(async () => abrir({
            id: 'id-1',
            codigo: 'SOL-2026-001',
            cantidadPasajeros: 4,
            tarifa: 100000,
            estado: 'pendiente'
        }));

        it('debe dejar vacíos los campos que el backend no envió', () => {

            const v = component.formulario.getRawValue();

            expect(v.nombreCliente).toBe('');
            expect(v.origen.direccion).toBe('');
            expect(v.fechaHora).toBe('');
        });

        it('no debe guardar hasta completar los datos obligatorios', () => {

            component.enviar();

            expect(actualizar).not.toHaveBeenCalled();
            expect(component.formulario.controls.nombreCliente.touched).toBe(true);
        });
    });
});
