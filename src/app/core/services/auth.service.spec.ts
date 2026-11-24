
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService - Autenticación API v2', () => {

    let service: AuthService;
    let httpMock: HttpTestingController;

    const urlOriginal = environment.apiBaseUrl;
    const apiUrl = 'https://api.test.local/track/api/v2';

    const credenciales = {
        email: 'usuario@ejemplo.com',
        password: 'clave-de-prueba',
        tenant_id: '00000000-0000-0000-0000-000000000001'
    };

    beforeEach(() => {
        environment.apiBaseUrl = apiUrl;

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        environment.apiBaseUrl = urlOriginal;
    });

    it('debe crear el servicio de autenticación', () => {
        expect(service).toBeTruthy();
    });

    it('debe iniciar sesión mediante la API v2', () => {
        let tokenRecibido: string | undefined;

        service.iniciarSesion(credenciales).subscribe(datos => {
            tokenRecibido = datos.access_token;
        });

        const req = httpMock.expectOne(
            `${apiUrl}/auth/login`
        );

        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(credenciales);

        req.flush({
            errors: [],
            data: {
                access_token: 'token-simulado',
                token_type: 'Bearer',
                expires_in: 900
            }
        });

        expect(tokenRecibido).toBe('token-simulado');
        expect(service.obtenerToken()).toBe('token-simulado');
    });

    it('debe iniciar sin un token almacenado', () => {
        expect(service.obtenerToken()).toBeNull();
    });

    it('debe rechazar una respuesta sin access_token', () => {
        let mensajeError = '';

        service.iniciarSesion(credenciales).subscribe({
            error: error => {
                mensajeError = error.message;
            }
        });

        const req = httpMock.expectOne(
            `${apiUrl}/auth/login`
        );

        req.flush({
            errors: [],
            data: {}
        });

        expect(mensajeError).toContain(
            'La API no devolvió un token'
        );

        expect(service.obtenerToken()).toBeNull();
    });

    it('debe propagar errores de autenticación HTTP 401', () => {
        let codigoError: number | undefined;

        service.iniciarSesion(credenciales).subscribe({
            error: error => {
                codigoError = error.status;
            }
        });

        const req = httpMock.expectOne(
            `${apiUrl}/auth/login`
        );

        req.flush(
            {
                errors: [{
                    code: 'unauthorized',
                    message: 'Credenciales inválidas'
                }]
            },
            {
                status: 401,
                statusText: 'Unauthorized'
            }
        );

        expect(codigoError).toBe(401);
        expect(service.obtenerToken()).toBeNull();
    });

    it('debe permitir limpiar la sesión local', () => {
        service.iniciarSesion(credenciales).subscribe();

        const req = httpMock.expectOne(
            `${apiUrl}/auth/login`
        );

        req.flush({
            errors: [],
            data: {
                access_token: 'token-simulado',
                token_type: 'Bearer',
                expires_in: 900
            }
        });

        expect(service.obtenerToken()).toBe('token-simulado');

        service.limpiarSesion();

        expect(service.obtenerToken()).toBeNull();
    });

});
