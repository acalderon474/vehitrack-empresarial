
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { AsignacionService } from './asignacion.service';
import { SolicitudService } from './solicitud.service';
import { environment } from '../../../environments/environment';

const SOL_14 = '00000000-0000-4000-8000-000000000014'; // 12 pasajeros, 25-nov 07:00
const SOL_13 = '00000000-0000-4000-8000-000000000013'; // asignada (V-102 + C-002)
const SOL_11 = '00000000-0000-4000-8000-000000000011'; // finalizada
const SOL_10 = '00000000-0000-4000-8000-000000000010'; // 25 pasajeros (sin vehículo)
const SOL_09 = '00000000-0000-4000-8000-000000000009'; // cancelada

describe('AsignacionService', () => {

    let service: AsignacionService;
    let solicitudes: SolicitudService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v2';

    function iniciar(urlApi: string): void {
        environment.apiBaseUrl = urlApi;

        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        service = TestBed.inject(AsignacionService);
        solicitudes = TestBed.inject(SolicitudService);
        httpMock = TestBed.inject(HttpTestingController);
    }

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    describe('con la API configurada', () => {

        beforeEach(() => iniciar(apiUrl));

        it('debe pedir las recomendaciones de una solicitud (VT-012)', () => {

            let placa: string | undefined;

            service.recomendar('sol-1').subscribe(r => {
                placa = r.alternativas[0]?.placa;
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests/sol-1/recommendations`);
            expect(req.request.method).toBe('GET');

            req.flush({
                solicitud_id: 'sol-1',
                tarifa_pactada: 650000,
                alternativas: [{
                    vehiculo_id: 'veh-1', placa: 'KLA-452', km_vacios: 7,
                    km_totales_estimados: 129.5, costo_estimado: 278032,
                    margen_proyectado: 371968, porcentaje_margen: 57.23,
                    recomendado: true, explicacion_criterios: 'x'
                }]
            });

            expect(placa).toBe('KLA-452');
        });

        it('debe listar solo los conductores disponibles', () => {

            let nombres: string[] = [];

            service.listarConductoresDisponibles().subscribe(c => {
                nombres = c.map(x => x.nombreCompleto);
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/drivers?estado=disponible&limite=100`);
            expect(req.request.method).toBe('GET');

            req.flush({
                total: 1,
                elementos: [{ id: 'c1', nombre_completo: 'Carlos Pérez', categoria_licencia: 'C2', estado: 'disponible' }]
            });

            expect(nombres).toEqual(['Carlos Pérez']);
        });

        it('debe confirmar con el contrato POST enterprise/assignments (VT-013)', () => {

            let estado: string | undefined;

            service.confirmar({
                solicitudId: 'sol-1', vehiculoId: 'veh-1', conductorId: 'con-1',
                motivoSeleccion: 'Mayor margen estimado entre opciones elegibles'
            }).subscribe(r => {
                estado = r.estado;
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/assignments`);

            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                solicitud_id: 'sol-1',
                vehiculo_id: 'veh-1',
                conductor_id: 'con-1',
                motivo_seleccion: 'Mayor margen estimado entre opciones elegibles'
            });

            req.flush({
                asignacion_id: 'asg-1', estado: 'confirmada', costo_estimado: 278032,
                estado_vehiculo: 'en_servicio', estado_conductor: 'asignado'
            });

            expect(estado).toBe('confirmada');
        });

        it('debe consultar el historial de la asignación', () => {

            service.obtenerHistorial('sol 1').subscribe();

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests/sol%201/assignment`);
            expect(req.request.method).toBe('GET');

            req.flush({
                asignacion_id: 'a', solicitud_id: 's', vehiculo_elegido_id: 'v', conductor_id: 'c',
                conductor_nombre: 'X', motivo_seleccion: 'm', recomendada: true,
                costo_estimado: 1, margen_proyectado: 2, estado_servicio: 'confirmado', alternativas: []
            });
        });

        it('debe propagar el conflicto 409 al confirmar', () => {

            let estado: number | undefined;

            service.confirmar({ solicitudId: 's', vehiculoId: 'v', conductorId: 'c', motivoSeleccion: '' })
                .subscribe({ error: (e: HttpErrorResponse) => { estado = e.status; } });

            httpMock.expectOne(`${apiUrl}/enterprise/assignments`)
                .flush({}, { status: 409, statusText: 'Conflict' });

            expect(estado).toBe(409);
        });
    });

    describe('sin API configurada (datos simulados)', () => {

        beforeEach(() => iniciar(''));

        it('debe usar datos simulados', () => {
            expect(service.usaDatosSimulados).toBe(true);
        });

        it('debe recomendar por mayor margen, con la primera como recomendada', async () => {

            const r = await firstValueFrom(service.recomendar(SOL_14));

            expect(r.tarifaPactada).toBe(650000);
            expect(r.alternativas.length).toBeGreaterThanOrEqual(2);
            expect(r.alternativas[0]?.recomendado).toBe(true);
            expect(r.alternativas.filter(a => a.recomendado)).toHaveLength(1);

            const margenes = r.alternativas.map(a => a.margenProyectado);
            expect(margenes).toEqual([...margenes].sort((a, b) => b - a));

            for (const a of r.alternativas) {
                expect(a.margenProyectado).toBe(650000 - a.costoEstimado);
                expect(a.capacidadPasajeros).toBeGreaterThanOrEqual(12);
                expect(a.codigoVehiculo).toMatch(/^V-\d{3}$/);
                expect(a.explicacionCriterios.length).toBeGreaterThan(10);
            }
        });

        it('debe calcular el costo con el modelo de la matriz', async () => {

            const r = await firstValueFrom(service.recomendar(SOL_14));
            const v101 = r.alternativas.find(a => a.placa === 'KLA-452')!;

            // 122,5 km de servicio + km vacíos; Van de 32,5 km/gal, 850/km,
            // despacho 45.000 + viáticos 60.000 (servicio de más de 80 km);
            // galón simulado a 15.800.
            const kmTotales = 122.5 + v101.kmVacios;
            const esperado = Math.round(
                (kmTotales / 32.5) * 15800 + kmTotales * 850 + 45000 + 60000
            );

            expect(v101.kmTotalesEstimados).toBeCloseTo(kmTotales, 1);
            expect(v101.costoEstimado).toBe(esperado);
        });

        it('debe excluir los vehículos ocupados en el mismo horario', async () => {

            // V-102 (12 plazas) ya está asignado a SOL-2026-013, que se cruza.
            const r = await firstValueFrom(service.recomendar(SOL_14));

            expect(r.alternativas.some(a => a.placa === 'KLB-118')).toBe(false);
        });

        it('debe devolver una lista vacía si ningún vehículo alcanza', async () => {

            // 25 pasajeros: el único bus grande está en mantenimiento.
            const r = await firstValueFrom(service.recomendar(SOL_10));

            expect(r.alternativas).toEqual([]);
        });

        it('no debe recomendar para solicitudes que no están pendientes', async () => {

            await expect(firstValueFrom(service.recomendar(SOL_13)))
                .rejects.toMatchObject({ status: 409 });
            await expect(firstValueFrom(service.recomendar(SOL_09)))
                .rejects.toMatchObject({ status: 409 });
            await expect(firstValueFrom(service.recomendar('no-existe')))
                .rejects.toMatchObject({ status: 404 });
        });

        it('debe listar solo conductores disponibles', async () => {

            const conductores = await firstValueFrom(service.listarConductoresDisponibles());

            expect(conductores.map(c => c.codigo)).toEqual(['C-001', 'C-002', 'C-003', 'C-004', 'C-006']);
            expect(conductores.every(c => c.estado === 'disponible')).toBe(true);
        });

        describe('confirmación', () => {

            async function recomendada(): Promise<string> {
                const r = await firstValueFrom(service.recomendar(SOL_14));
                return r.alternativas[0]!.vehiculoId;
            }

            it('debe confirmar la recomendada y devolver el contrato de la matriz', async () => {

                const r = await firstValueFrom(service.recomendar(SOL_14));
                const mejor = r.alternativas[0]!;

                const confirmacion = await firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: mejor.vehiculoId, conductorId: 'con-001',
                    motivoSeleccion: ''
                }));

                expect(confirmacion.estado).toBe('confirmada');
                expect(confirmacion.estadoVehiculo).toBe('en_servicio');
                expect(confirmacion.estadoConductor).toBe('asignado');
                expect(confirmacion.costoEstimado).toBe(mejor.costoEstimado);
            });

            it('debe cambiar la solicitud a asignada y dejar el historial', async () => {

                await firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: await recomendada(),
                    conductorId: 'con-001', motivoSeleccion: ''
                }));

                const asignadas = await firstValueFrom(solicitudes.listar({ estado: 'asignada' }));
                expect(asignadas.elementos.map(s => s.codigo)).toContain('SOL-2026-014');

                const historial = await firstValueFrom(service.obtenerHistorial(SOL_14));
                expect(historial.conductorNombre).toBe('Carlos Pérez');
                expect(historial.esRecomendada).toBe(true);
                expect(historial.motivoSeleccion).toBe('Recomendación óptima del sistema');

                await expect(firstValueFrom(service.recomendar(SOL_14)))
                    .rejects.toMatchObject({ status: 409 });
            });

            it('debe exigir un motivo si se elige una alternativa distinta de la recomendada', async () => {

                const r = await firstValueFrom(service.recomendar(SOL_14));
                const otra = r.alternativas[1]!;

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: otra.vehiculoId,
                    conductorId: 'con-001', motivoSeleccion: '   '
                }))).rejects.toMatchObject({ status: 422 });

                const ok = await firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: otra.vehiculoId,
                    conductorId: 'con-001', motivoSeleccion: 'El cliente pidió el microbús'
                }));
                expect(ok.estado).toBe('confirmada');

                const historial = await firstValueFrom(service.obtenerHistorial(SOL_14));
                expect(historial.esRecomendada).toBe(false);
                expect(historial.motivoSeleccion).toBe('El cliente pidió el microbús');
            });

            it('debe rechazar un conductor con servicio cruzado', async () => {

                // C-002 (Luis Herrera) está asignado a SOL-2026-013, que se cruza.
                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: await recomendada(),
                    conductorId: 'con-002', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 409 });
            });

            it('debe rechazar licencia vencida y conductor en descanso', async () => {

                const vehiculo = await recomendada();

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: vehiculo,
                    conductorId: 'con-006', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 409 });

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: vehiculo,
                    conductorId: 'con-005', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 409 });
            });

            it('debe rechazar capacidad insuficiente y vehículo en mantenimiento', async () => {

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: 'veh-104',
                    conductorId: 'con-001', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 422 });

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_14, vehiculoId: 'veh-106',
                    conductorId: 'con-001', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 409 });
            });

            it('debe responder 404 si el vehículo, el conductor o la solicitud no existen', async () => {

                for (const datos of [
                    { solicitudId: 'no-existe', vehiculoId: 'veh-101', conductorId: 'con-001' },
                    { solicitudId: SOL_14, vehiculoId: 'no-existe', conductorId: 'con-001' },
                    { solicitudId: SOL_14, vehiculoId: 'veh-101', conductorId: 'no-existe' }
                ]) {
                    await expect(firstValueFrom(service.confirmar({ ...datos, motivoSeleccion: 'x' })))
                        .rejects.toMatchObject({ status: 404 });
                }
            });

            it('no debe asignar una solicitud que ya no está pendiente', async () => {

                await expect(firstValueFrom(service.confirmar({
                    solicitudId: SOL_13, vehiculoId: 'veh-101',
                    conductorId: 'con-001', motivoSeleccion: 'x'
                }))).rejects.toMatchObject({ status: 409 });
            });

            it('cancelar una solicitud asignada debe liberar la asignación y el vehículo', async () => {

                await firstValueFrom(solicitudes.cambiarEstado(SOL_13, {
                    estado: 'cancelada', motivo_cancelacion: 'Reprogramado por cliente'
                }));

                await expect(firstValueFrom(service.obtenerHistorial(SOL_13)))
                    .rejects.toMatchObject({ status: 404 });

                const r = await firstValueFrom(service.recomendar(SOL_14));
                expect(r.alternativas.some(a => a.placa === 'KLB-118')).toBe(true);
            });
        });

        describe('historial', () => {

            it('debe mostrar la asignación finalizada con el margen registrado', async () => {

                const h = await firstValueFrom(service.obtenerHistorial(SOL_11));

                expect(h.conductorCodigo).toBe('C-004');
                expect(h.estadoServicio).toBe('finalizado');
                expect(h.codigoRecorrido).toBe('R-7825');
                expect(h.margenRegistrado).toBe(h.margenPrevisto - 5000);
                expect(h.alternativas.filter(a => a.recomendado)).toHaveLength(1);
                expect(h.alternativas.some(a => a.vehiculoId === h.vehiculoElegidoId)).toBe(true);
            });

            it('debe mostrar una asignación confirmada sin margen registrado', async () => {

                const h = await firstValueFrom(service.obtenerHistorial(SOL_13));

                expect(h.conductorNombre).toBe('Luis Herrera');
                expect(h.estadoServicio).toBe('confirmado');
                expect('margenRegistrado' in h).toBe(false);
            });

            it('debe responder 404 si la solicitud no tiene asignación', async () => {

                await expect(firstValueFrom(service.obtenerHistorial(SOL_14)))
                    .rejects.toMatchObject({ status: 404 });
            });
        });
    });
});
