
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { ReporteService } from './reporte.service';
import { environment } from '../../../environments/environment';

import type {
    ReporteRentabilidadDto
} from '../dto/reporte.dto';

describe('ReporteService', () => {

    let service: ReporteService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v1';

    const endpoint =
        `${apiUrl}/enterprise/reports/profitability`;

    beforeEach(() => {

        environment.apiBaseUrl = apiUrl;

        TestBed.configureTestingModule({
            providers: [
                ReporteService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(ReporteService);
        httpMock = TestBed.inject(HttpTestingController);

    });

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    it('debe crear el servicio de Reportes', () => {
        expect(service).toBeTruthy();
    });

    it('debe consultar la rentabilidad VT-015', () => {

        const reporte: ReporteRentabilidadDto = {
            resumen: {
                tarifa_total: 650000,
                costo_estimado_total: 278032,
                costo_real_total: 287000,
                desviacion: 8968
            },
            recorridos: [
                {
                    codigo: 'REC-001',
                    placa: 'KLA-452',
                    margen_estimado: 371968,
                    margen_real: 363000
                }
            ]
        };

        let respuesta: ReporteRentabilidadDto | undefined;

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe(datos => {
            respuesta = datos;
        });

        const req = httpMock.expectOne(
            `${endpoint}?desde=2026-11-01&hasta=2026-11-30`
        );

        expect(req.request.method).toBe('GET');

        req.flush(reporte);

        expect(respuesta).toEqual(reporte);
    });

    it('debe filtrar por vehiculo', () => {

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            vehiculo_id: 'V001'
        }).subscribe();

        const req = httpMock.expectOne(
            `${endpoint}?desde=2026-11-01&hasta=2026-11-30&vehiculo_id=V001`
        );

        expect(req.request.method).toBe('GET');

        req.flush({
            resumen: {
                tarifa_total: 0,
                costo_estimado_total: 0,
                costo_real_total: 0,
                desviacion: 0
            },
            recorridos: []
        });
    });

    it('debe filtrar por conductor', () => {

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            conductor_id: 'C001'
        }).subscribe();

        const req = httpMock.expectOne(
            `${endpoint}?desde=2026-11-01&hasta=2026-11-30&conductor_id=C001`
        );

        expect(req.request.method).toBe('GET');

        req.flush({
            resumen: {
                tarifa_total: 0,
                costo_estimado_total: 0,
                costo_real_total: 0,
                desviacion: 0
            },
            recorridos: []
        });
    });

    it('debe admitir ambos filtros opcionales', () => {

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            vehiculo_id: 'V001',
            conductor_id: 'C001'
        }).subscribe();

        const req = httpMock.expectOne(
            `${endpoint}?desde=2026-11-01&hasta=2026-11-30&vehiculo_id=V001&conductor_id=C001`
        );

        expect(req.request.method).toBe('GET');

        req.flush({
            resumen: {
                tarifa_total: 0,
                costo_estimado_total: 0,
                costo_real_total: 0,
                desviacion: 0
            },
            recorridos: []
        });
    });

    it('debe aceptar la respuesta envuelta de la API v2', () => {

        const reporte: ReporteRentabilidadDto = {
            resumen: {
                tarifa_total: 120000,
                costo_estimado_total: 51000,
                costo_real_total: 56000,
                desviacion: 5000
            },
            recorridos: []
        };

        let respuesta: ReporteRentabilidadDto | undefined;

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe(datos => respuesta = datos);

        httpMock.expectOne(`${endpoint}?desde=2026-11-01&hasta=2026-11-30`)
            .flush({ errors: [], data: reporte });

        expect(respuesta).toEqual(reporte);
    });

    it('debe usar datos de prueba cuando no hay API configurada', () => {

        environment.apiBaseUrl = '';

        let respuesta: ReporteRentabilidadDto | undefined;

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe(datos => respuesta = datos);

        httpMock.expectNone(() => true);
        expect(respuesta?.resumen.tarifa_total).toBe(1350000);
        expect(respuesta?.recorridos.length).toBe(10);
    });

    it('debe propagar errores HTTP del backend', () => {

        let codigoError: number | undefined;

        service.obtenerRentabilidad({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe({
            error: error => {
                codigoError = error.status;
            }
        });

        const req = httpMock.expectOne(
            `${endpoint}?desde=2026-11-01&hasta=2026-11-30`
        );

        req.flush(
            { mensaje: 'Error del servidor' },
            {
                status: 500,
                statusText: 'Internal Server Error'
            }
        );

        expect(codigoError).toBe(500);
    });

});
