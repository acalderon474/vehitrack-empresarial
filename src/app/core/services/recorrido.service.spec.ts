import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { RecorridoService } from './recorrido.service';
import { environment } from '../../../environments/environment';

import type { DatosCierreRecorrido, RecorridoSeguimiento } from '../models/recorrido';
import type { ResultadoCierreRecorridoDto } from '../dto/recorrido.dto';

describe('RecorridoService', () => {

    let service: RecorridoService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/api/v2';

    const cierre: DatosCierreRecorrido = {
        kilometrosRecorridos: 15,
        gastos: {
            combustible: 20000,
            peajes: 5000,
            mantenimiento: 4000,
            conductor: 12000,
            otros: 0
        }
    };

    function configurar(url: string): void {
        environment.apiBaseUrl = url;

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(RecorridoService);
        httpMock = TestBed.inject(HttpTestingController);
    }

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    describe('con API configurada', () => {

        beforeEach(() => configurar(apiUrl));

        it('debe consultar los recorridos y adaptar la respuesta envuelta', () => {

            let respuesta: RecorridoSeguimiento[] = [];

            service.listar().subscribe(lista => respuesta = lista);

            const req = httpMock.expectOne(`${apiUrl}/enterprise/trips`);
            expect(req.request.method).toBe('GET');

            req.flush({
                errors: [],
                data: {
                    elementos: [{
                        id: 'rec-1',
                        codigo: 'R-1',
                        asignacion_id: 'asg-1',
                        solicitud_codigo: 'S-1',
                        origen: 'A',
                        destino: 'B',
                        placa: 'AAA-111',
                        conductor: 'C-1',
                        estado: 'en_curso',
                        fecha_inicio: '2026-11-20T08:00:00Z',
                        tarifa_pactada: 100000,
                        costo_estimado: 40000,
                        margen_estimado: 60000
                    }],
                    total: 1
                }
            });

            expect(respuesta.length).toBe(1);
            expect(respuesta[0].asignacionId).toBe('asg-1');
            expect(respuesta[0].tarifa).toBe(100000);
        });

        it('debe enviar el cierre VT-014 con el contrato JSON aprobado', () => {

            const resultado: ResultadoCierreRecorridoDto = {
                recorrido_id: 'rec-1',
                tarifa_pactada: 95000,
                costo_estimado: 41000,
                costo_real: 41000,
                desviacion_costos: 0,
                margen_real: 54000,
                porcentaje_margen_real: 56.84
            };

            let respuesta: ResultadoCierreRecorridoDto | undefined;

            service.cerrarGastos('asg-1', cierre)
                .subscribe(datos => respuesta = datos);

            const req = httpMock.expectOne(
                `${apiUrl}/enterprise/trips/asg-1/close-expenses`
            );

            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                km_reales: 15,
                costo_combustible: 20000,
                costo_peajes: 5000,
                costo_mantenimiento: 4000,
                costo_conductor: 12000,
                otros_gastos: 0
            });

            req.flush({ errors: [], data: resultado });

            expect(respuesta).toEqual(resultado);
        });

        it('debe propagar los errores HTTP del backend', () => {

            let codigoError: number | undefined;

            service.cerrarGastos('asg-1', cierre).subscribe({
                error: error => codigoError = error.status
            });

            httpMock.expectOne(`${apiUrl}/enterprise/trips/asg-1/close-expenses`)
                .flush(
                    { mensaje: 'Recorrido ya cerrado' },
                    { status: 409, statusText: 'Conflict' }
                );

            expect(codigoError).toBe(409);
        });

    });

    describe('sin API configurada', () => {

        beforeEach(() => configurar(''));

        it('debe usar los datos de prueba sin realizar peticiones', () => {

            let respuesta: RecorridoSeguimiento[] = [];

            service.listar().subscribe(lista => respuesta = lista);

            expect(respuesta.length).toBe(12);
            httpMock.expectNone(() => true);
        });

        it('debe cerrar un recorrido de prueba y reflejarlo en el listado', () => {

            let resultado: ResultadoCierreRecorridoDto | undefined;
            let lista: RecorridoSeguimiento[] = [];

            service.cerrarGastos('asg-7826', cierre)
                .subscribe(datos => resultado = datos);

            service.listar().subscribe(datos => lista = datos);

            expect(resultado?.margen_real).toBe(54000);
            expect(lista.find(r => r.asignacionId === 'asg-7826')?.estado)
                .toBe('finalizado');
        });

        it('debe informar el error al cerrar un recorrido ya cerrado', () => {

            let mensaje = '';

            service.cerrarGastos('asg-7825', cierre).subscribe({
                error: (error: Error) => mensaje = error.message
            });

            expect(mensaje).toBe('El recorrido ya fue cerrado.');
        });

    });

});
