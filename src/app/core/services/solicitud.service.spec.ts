
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { SolicitudService } from './solicitud.service';
import { distanciaRectaKm } from '../mocks/solicitud.mock';
import { environment } from '../../../environments/environment';

import type { NuevaSolicitud, Solicitud } from '../models/solicitud';
import type { SolicitudCreadaDto } from '../dto/solicitud.dto';

describe('SolicitudService', () => {

    let service: SolicitudService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v1';

    const datos: NuevaSolicitud = {
        nombreCliente: 'Hotel Caribe',
        origen: { direccion: 'Barranquilla, Atlántico', lat: 11.01, lng: -74.82 },
        destino: { direccion: 'Cartagena, Bolívar', lat: 10.42, lng: -75.54 },
        fechaHora: '2026-11-29T12:00:00.000Z',
        cantidadPasajeros: 12,
        tarifa: 650000
    };

    /**
     * ApiService guarda la dirección de la API al crearse,
     * así que hay que configurarla ANTES de pedir el servicio.
     */
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

        beforeEach(() => {
            iniciar(apiUrl);
        });

        it('no debe usar datos simulados', () => {
            expect(service.usaDatosSimulados).toBe(false);
        });

        it('debe registrar la solicitud con el contrato VT-010', () => {

            const respuesta: SolicitudCreadaDto = {
                id: 'uuid-1',
                codigo: 'SOL-2026-014',
                km_estimados: 122.5,
                duracion_estimada_min: 110,
                estado: 'pendiente'
            };

            let resultado: Solicitud | undefined;

            service.crear(datos).subscribe(s => {
                resultado = s;
            });

            const req = httpMock.expectOne(`${apiUrl}/enterprise/requests`);

            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                nombre_cliente: 'Hotel Caribe',
                origen: { direccion: 'Barranquilla, Atlántico', lat: 11.01, lng: -74.82 },
                destino: { direccion: 'Cartagena, Bolívar', lat: 10.42, lng: -75.54 },
                fecha_servicio: '2026-11-29T12:00:00.000Z',
                pasajeros: 12,
                tarifa_pactada: 650000
            });

            req.flush(respuesta);

            expect(resultado?.codigo).toBe('SOL-2026-014');
            expect(resultado?.estado).toBe('pendiente');
            expect(resultado?.kmEstimados).toBe(122.5);
            expect(resultado?.nombreCliente).toBe('Hotel Caribe');
        });

        it('debe propagar los errores HTTP del backend', () => {

            let estado: number | undefined;

            service.crear(datos).subscribe({
                error: (e: { status: number }) => {
                    estado = e.status;
                }
            });

            httpMock
                .expectOne(`${apiUrl}/enterprise/requests`)
                .flush(
                    { mensaje: 'Datos inválidos' },
                    { status: 422, statusText: 'Unprocessable Entity' }
                );

            expect(estado).toBe(422);
        });
    });

    describe('sin API configurada (datos simulados)', () => {

        beforeEach(() => {
            iniciar('');
        });

        it('debe usar datos simulados', () => {
            expect(service.usaDatosSimulados).toBe(true);
        });

        it('debe registrar sin hacer peticiones HTTP', async () => {

            const solicitud = await firstValueFrom(service.crear(datos));

            httpMock.expectNone(() => true);

            expect(solicitud.estado).toBe('pendiente');
            expect(solicitud.codigo).toMatch(/^SOL-2026-\d{3}$/);
            expect(solicitud.nombreCliente).toBe('Hotel Caribe');
        });

        it('debe generar códigos consecutivos', async () => {

            const primera = await firstValueFrom(service.crear(datos));
            const segunda = await firstValueFrom(service.crear(datos));

            expect(primera.codigo).toBe('SOL-2026-015');
            expect(segunda.codigo).toBe('SOL-2026-016');
            expect(primera.id).not.toBe(segunda.id);
        });

        it('debe estimar distancia y duración si hay coordenadas', async () => {

            const solicitud = await firstValueFrom(service.crear(datos));

            expect(solicitud.kmEstimados).toBeGreaterThan(100);
            expect(solicitud.kmEstimados).toBeLessThan(200);
            expect(solicitud.duracionEstimadaMin).toBeGreaterThan(60);
        });

        it('no debe estimar nada si faltan coordenadas', async () => {

            const sinCoordenadas: NuevaSolicitud = {
                ...datos,
                origen: { direccion: 'Hotel sin geocodificar' }
            };

            const solicitud = await firstValueFrom(service.crear(sinCoordenadas));

            expect(solicitud.kmEstimados).toBeUndefined();
            expect(solicitud.duracionEstimadaMin).toBeUndefined();
        });
    });

    it('la distancia entre dos puntos iguales debe ser cero', () => {
        iniciar('');
        expect(distanciaRectaKm(11.01, -74.82, 11.01, -74.82)).toBe(0);
    });
});
