import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
    HttpClient,
    provideHttpClient,
    withInterceptors
} from '@angular/common/http';

import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('AuthInterceptor - JWT Bearer API v2', () => {

    let http: HttpClient;
    let httpMock: HttpTestingController;
    let token: string | null;

    const urlOriginal = environment.apiBaseUrl;
    const accesoOriginal = environment.accesoDemoAutomatico;
    let intentosLogin = 0;
    const baseUrl = 'https://api.test.local/track/api/v2';

    beforeEach(() => {
        environment.apiBaseUrl = baseUrl;
        environment.accesoDemoAutomatico = false;
        intentosLogin = 0;
        token = 'jwt-de-prueba';

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(
                    withInterceptors([authInterceptor])
                ),
                provideHttpClientTesting(),
                {
                    provide: AuthService,
                    useValue: {
                        obtenerToken: () => token,

                        iniciarSesion: () => {
                            intentosLogin++;
                            token = 'jwt-automatico-prueba';

                            return of({
                                access_token: 'jwt-automatico-prueba',
                                token_type: 'Bearer',
                                expires_in: 900
                            });
                        }
                    }
                }
            ]
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
        environment.accesoDemoAutomatico = accesoOriginal;
    });

    it('debe agregar el token JWT a VT-004', () => {
        const url = `${baseUrl}/enterprise/dashboard/kpis`;

        http.get(url).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.get('Authorization'))
            .toBe('Bearer jwt-de-prueba');

        req.flush({});
    });

    it('debe agregar el token JWT a VT-005', () => {
        const url =
            `${baseUrl}/enterprise/dashboard/financial-summary`;

        http.get(url).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.get('Authorization'))
            .toBe('Bearer jwt-de-prueba');

        req.flush({});
    });

    it('no debe agregar token a la petición de login', () => {
        const url = `${baseUrl}/auth/login`;

        http.post(url, {}).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.has('Authorization'))
            .toBe(false);

        req.flush({});
    });

    it('no debe agregar token a la renovación de sesión', () => {
        const url = `${baseUrl}/auth/refresh`;

        http.post(url, {}).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.has('Authorization'))
            .toBe(false);

        req.flush({});
    });

    it('no debe enviar el token a servidores externos', () => {
        const url = 'https://otro-servidor.com/api/v2/datos';

        http.get(url).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.has('Authorization'))
            .toBe(false);

        req.flush({});
    });

    it('no debe agregar Authorization sin sesión', () => {
        token = null;

        const url = `${baseUrl}/enterprise/dashboard/kpis`;

        http.get(url).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.has('Authorization'))
            .toBe(false);

        req.flush({});
    });

    it('debe respetar una cabecera Authorization existente', () => {
        const url = `${baseUrl}/enterprise/dashboard/kpis`;

        http.get(url, {
            headers: {
                Authorization: 'Bearer token-existente'
            }
        }).subscribe();

        const req = httpMock.expectOne(url);

        expect(req.request.headers.get('Authorization'))
            .toBe('Bearer token-existente');

        req.flush({});
    });


    it('debe iniciar sesión automáticamente y enviar el JWT al Dashboard', () => {
        token = null;
        environment.accesoDemoAutomatico = true;

        const url =
            `${baseUrl}/enterprise/dashboard/kpis`;

        http.get(url).subscribe();

        const req = httpMock.expectOne(url);

        expect(intentosLogin).toBe(1);

        expect(req.request.headers.get('Authorization'))
            .toBe('Bearer jwt-automatico-prueba');

        req.flush({
            errors: [],
            data: {
                vehiculos_total: 1,
                vehiculos_disponibles: 1,
                vehiculos_en_servicio: 0,
                solicitudes_pendientes: 1,
                recorridos_finalizados: 0
            }
        });
    });
});
