
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { SolicitudService } from './solicitud.service';
import { environment } from '../../../environments/environment';

import type { ListadoSolicitudesDto } from '../dto/solicitud-listado.dto';
import type { NuevaSolicitud } from '../models/solicitud';

describe('SolicitudService (VT-011: listado, edición y estados)', () => {

    let service: SolicitudService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v2';

    function iniciar(urlApi: string): void {
        environment.apiBaseUrl = urlApi;

        TestBed.configureTestingModule({
            providers: [
                SolicitudService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(SolicitudService);
        httpMock = TestBed.inject(HttpTestingController);
    }

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    describe('con la API configurada', () => {

        beforeEach(() => iniciar(apiUrl));

        it('debe listar sin filtros', () => {

            const respuesta: ListadoSolicitudesDto = {
                elementos: [{
                    id: 'uuid-1',
                    codigo: 'SOL-2026-014',
                    pasajeros: 12,
                    tarifa_pactada: 650000,
                    estado: 'pendiente'
                }],
                total: 10
            };

            let total: number | undefined;
            let codigo: string | undefined;

            service.listar().subscribe(l => {
                total = l.total;
                codigo = l.elementos[0]?.codigo;
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests`);
            expect(req.request.method).toBe('GET');
            req.flush(respuesta);

            expect(total).toBe(10);
            expect(codigo).toBe('SOL-2026-014');
        });

        it('debe enviar los filtros de estado y fecha', () => {

            service.listar({ estado: 'asignada', fecha: '2026-11-25' }).subscribe();

            const req = httpMock.expectOne(
                `${apiUrl}/enterprise/requests?estado=asignada&fecha=2026-11-25`
            );
            expect(req.request.method).toBe('GET');
            req.flush({ elementos: [], total: 0 });
        });

        it('debe cancelar con el contrato PATCH .../status', () => {

            let terminado = false;

            service.cambiarEstado('uuid-1', {
                estado: 'cancelada',
                motivo_cancelacion: 'Reprogramado por cliente'
            }).subscribe(() => {
                terminado = true;
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests/uuid-1/status`);

            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({
                estado: 'cancelada',
                motivo_cancelacion: 'Reprogramado por cliente'
            });

            req.flush({});
            expect(terminado).toBe(true);
        });

        it('debe codificar el identificador en la ruta', () => {

            service.cambiarEstado('a/b c', { estado: 'cancelada', motivo_cancelacion: 'x' })
                .subscribe();

            httpMock
                .expectOne(`${apiUrl}/enterprise/requests/a%2Fb%20c/status`)
                .flush({});
        });

        it('debe editar enviando solo los campos cambiados', () => {

            service.actualizar('uuid-1', {
                nombreCliente: 'Hotel Nuevo',
                tarifa: 700000
            }).subscribe();

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests/uuid-1`);

            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual({
                nombre_cliente: 'Hotel Nuevo',
                tarifa_pactada: 700000
            });

            req.flush({});
        });

        it('debe propagar los errores del backend', () => {

            let estado: number | undefined;

            service.cambiarEstado('uuid-1', { estado: 'cancelada', motivo_cancelacion: 'x' })
                .subscribe({
                    error: (e: HttpErrorResponse) => {
                        estado = e.status;
                    }
                });

            httpMock
                .expectOne(`${apiUrl}/enterprise/requests/uuid-1/status`)
                .flush({}, { status: 409, statusText: 'Conflict' });

            expect(estado).toBe(409);
        });
    });

    describe('sin API configurada (datos simulados)', () => {

        beforeEach(() => iniciar(''));

        const nueva: NuevaSolicitud = {
            nombreCliente: 'Cliente Nuevo',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fechaHora: '2026-12-02T13:00:00.000Z',
            cantidadPasajeros: 6,
            tarifa: 500000
        };

        it('debe traer las nueve solicitudes de ejemplo', async () => {

            const listado = await firstValueFrom(service.listar());

            expect(listado.total).toBe(9);
            expect(listado.elementos).toHaveLength(9);
            expect(listado.elementos[0]?.codigo).toBe('SOL-2026-011');
        });

        it('debe filtrar por estado', async () => {

            const pendientes = await firstValueFrom(service.listar({ estado: 'pendiente' }));
            const canceladas = await firstValueFrom(service.listar({ estado: 'cancelada' }));

            expect(pendientes.total).toBe(5);
            expect(canceladas.total).toBe(1);
            expect(canceladas.elementos[0]?.motivoCancelacion).toBe('Cambio de vuelo del cliente');
        });

        it('debe filtrar por la fecha del servicio en hora de Colombia', async () => {

            const dia25 = await firstValueFrom(service.listar({ fecha: '2026-11-25' }));
            const sinDatos = await firstValueFrom(service.listar({ fecha: '2030-01-01' }));

            expect(dia25.elementos.map(s => s.codigo)).toEqual(['SOL-2026-014', 'SOL-2026-013']);
            expect(sinDatos.total).toBe(0);
        });

        it('debe combinar los filtros de estado y fecha', async () => {

            const resultado = await firstValueFrom(
                service.listar({ estado: 'asignada', fecha: '2026-11-25' })
            );

            expect(resultado.elementos.map(s => s.codigo)).toEqual(['SOL-2026-013']);
        });

        it('una solicitud registrada debe aparecer en el listado', async () => {

            const creada = await firstValueFrom(service.crear(nueva));
            const listado = await firstValueFrom(service.listar({ estado: 'pendiente' }));

            expect(creada.codigo).toBe('SOL-2026-015');
            expect(listado.total).toBe(6);
            expect(listado.elementos.some(s => s.codigo === 'SOL-2026-015')).toBe(true);
        });

        it('debe cancelar una solicitud pendiente guardando el motivo', async () => {

            await firstValueFrom(service.cambiarEstado(
                '00000000-0000-4000-8000-000000000014',
                { estado: 'cancelada', motivo_cancelacion: '  Reprogramado por cliente  ' }
            ));

            const canceladas = await firstValueFrom(service.listar({ estado: 'cancelada' }));
            const caso = canceladas.elementos.find(s => s.codigo === 'SOL-2026-014');

            expect(canceladas.total).toBe(2);
            expect(caso?.motivoCancelacion).toBe('Reprogramado por cliente');
        });

        it('debe exigir el motivo al cancelar', async () => {

            await expect(firstValueFrom(service.cambiarEstado(
                '00000000-0000-4000-8000-000000000014',
                { estado: 'cancelada', motivo_cancelacion: '   ' }
            ))).rejects.toMatchObject({ status: 422 });
        });

        it('no debe cancelar una solicitud finalizada ni una ya cancelada', async () => {

            await expect(firstValueFrom(service.cambiarEstado(
                '00000000-0000-4000-8000-000000000011',
                { estado: 'cancelada', motivo_cancelacion: 'x' }
            ))).rejects.toMatchObject({ status: 409 });

            await expect(firstValueFrom(service.cambiarEstado(
                '00000000-0000-4000-8000-000000000009',
                { estado: 'cancelada', motivo_cancelacion: 'x' }
            ))).rejects.toMatchObject({ status: 409 });
        });

        it('debe responder 404 si la solicitud no existe', async () => {

            await expect(firstValueFrom(service.cambiarEstado(
                'no-existe',
                { estado: 'cancelada', motivo_cancelacion: 'x' }
            ))).rejects.toMatchObject({ status: 404 });

            await expect(firstValueFrom(service.actualizar('no-existe', { tarifa: 1 })))
                .rejects.toMatchObject({ status: 404 });
        });

        it('debe editar todos los campos de una solicitud pendiente', async () => {

            await firstValueFrom(service.actualizar(
                '00000000-0000-4000-8000-000000000014',
                { nombreCliente: 'Clínica Nueva', cantidadPasajeros: 10, tarifa: 600000 }
            ));

            const listado = await firstValueFrom(service.listar({ estado: 'pendiente' }));
            const caso = listado.elementos.find(s => s.codigo === 'SOL-2026-014');

            expect(caso?.nombreCliente).toBe('Clínica Nueva');
            expect(caso?.cantidadPasajeros).toBe(10);
            expect(caso?.tarifa).toBe(600000);
        });

        it('con una asignación vigente solo debe permitir cliente y tarifa', async () => {

            const asignada = '00000000-0000-4000-8000-000000000013';

            await firstValueFrom(service.actualizar(asignada, {
                nombreCliente: 'Hotel El Prado Plaza',
                tarifa: 190000
            }));

            await expect(firstValueFrom(service.actualizar(asignada, { cantidadPasajeros: 3 })))
                .rejects.toMatchObject({ status: 409 });

            await expect(firstValueFrom(service.actualizar(asignada, {
                origen: { direccion: 'Otro lugar' }
            }))).rejects.toMatchObject({ status: 409 });

            await expect(firstValueFrom(service.actualizar(asignada, {
                fechaHora: '2026-12-05T12:00:00.000Z'
            }))).rejects.toMatchObject({ status: 409 });
        });

        it('no debe editar una solicitud finalizada ni cancelada', async () => {

            await expect(firstValueFrom(service.actualizar(
                '00000000-0000-4000-8000-000000000011',
                { nombreCliente: 'X' }
            ))).rejects.toMatchObject({ status: 409 });

            await expect(firstValueFrom(service.actualizar(
                '00000000-0000-4000-8000-000000000009',
                { tarifa: 1 }
            ))).rejects.toMatchObject({ status: 409 });
        });

        it('los datos devueltos no deben permitir modificar el almacén', async () => {

            const primero = await firstValueFrom(service.listar());
            primero.elementos[0]!.nombreCliente = 'ALTERADO';

            const segundo = await firstValueFrom(service.listar());

            expect(segundo.elementos[0]?.nombreCliente).not.toBe('ALTERADO');
        });
    });
});
