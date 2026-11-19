
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

import type {
    IndicadoresDashboardDto,
    ResumenFinancieroDashboardDto,
    PeriodoFinanciero
} from '../dto/dashboard.dto';

describe('DashboardService', () => {

    let service: DashboardService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v1';

    beforeEach(() => {
        environment.apiBaseUrl = apiUrl;

        TestBed.configureTestingModule({
            providers: [
                DashboardService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(DashboardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    it('debe crear el servicio Dashboard', () => {
        expect(service).toBeTruthy();
    });

    it('debe consultar los indicadores VT-004', () => {

        const indicadores: IndicadoresDashboardDto = {
            vehiculos_total: 6,
            vehiculos_disponibles: 4,
            vehiculos_en_servicio: 2,
            solicitudes_pendientes: 1,
            recorridos_finalizados: 10
        };

        let respuesta: IndicadoresDashboardDto | undefined;

        service.obtenerIndicadores({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe(datos => {
            respuesta = datos;
        });

        const req = httpMock.expectOne(
            `${apiUrl}/enterprise/dashboard/kpis?desde=2026-11-01&hasta=2026-11-30`
        );

        expect(req.request.method).toBe('GET');

        req.flush(indicadores);

        expect(respuesta).toEqual(indicadores);
    });

    it('debe consultar el resumen financiero VT-005', () => {

        const resumen: ResumenFinancieroDashboardDto = {
            ingreso_total: 650000,
            costo_estimado: 278032,
            costo_real: 287000,
            margen_estimado: 371968,
            margen_real: 363000
        };

        let respuesta:
            ResumenFinancieroDashboardDto | undefined;

        service.obtenerResumenFinanciero('mes')
            .subscribe(datos => {
                respuesta = datos;
            });

        const req = httpMock.expectOne(
            `${apiUrl}/enterprise/dashboard/financial-summary?periodo=mes`
        );

        expect(req.request.method).toBe('GET');

        req.flush(resumen);

        expect(respuesta).toEqual(resumen);
    });

    it('debe admitir los tres períodos financieros', () => {

        const periodos: PeriodoFinanciero[] = [
            'semana',
            'mes',
            'trimestre'
        ];

        for (const periodo of periodos) {

            service.obtenerResumenFinanciero(periodo)
                .subscribe();

            const req = httpMock.expectOne(
                `${apiUrl}/enterprise/dashboard/financial-summary?periodo=${periodo}`
            );

            expect(req.request.method).toBe('GET');

            req.flush({
                ingreso_total: 0,
                costo_estimado: 0,
                costo_real: 0,
                margen_estimado: 0,
                margen_real: 0
            });
        }
    });

    it('debe propagar los errores HTTP del backend', () => {

        let codigoError: number | undefined;

        service.obtenerIndicadores({
            desde: '2026-11-01',
            hasta: '2026-11-30'
        }).subscribe({
            error: error => {
                codigoError = error.status;
            }
        });

        const req = httpMock.expectOne(
            `${apiUrl}/enterprise/dashboard/kpis?desde=2026-11-01&hasta=2026-11-30`
        );

        req.flush(
            { mensaje: 'Servicio no disponible' },
            {
                status: 503,
                statusText: 'Service Unavailable'
            }
        );

        expect(codigoError).toBe(503);
    });

});
