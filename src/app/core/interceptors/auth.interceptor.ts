
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, finalize, shareReplay, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import type { DatosSesionDto } from '../dto/auth.dto';

// Credenciales exclusivas del entorno académico.
const CREDENCIALES_DEMO = {
    email: 'despachador@empresa.com',
    password: 'UnaClaveSeguraDe12+',
    tenant_id: '00000000-0000-0000-0000-000000000001'
};

// Evita iniciar varias sesiones simultáneamente.
let loginEnCurso$: Observable<DatosSesionDto> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);

    const baseUrl = environment.apiBaseUrl
        .trim()
        .replace(/\/+$/, '');

    const prefijoApi = `${baseUrl}/api/v2/`;

    const esApiV2 =
        !!baseUrl && req.url.startsWith(prefijoApi);

    const rutasSinToken = [
        'auth/login',
        'auth/refresh',
        'auth/logout',
        'auth/password/forgot',
        'auth/password/reset'
    ];

    const esRutaPublica = rutasSinToken.some(
        ruta => req.url === `${prefijoApi}${ruta}`
    );

    // No intervenir solicitudes externas o de autenticación.
    if (
        !esApiV2 ||
        esRutaPublica ||
        req.headers.has('Authorization')
    ) {
        return next(req);
    }

    const enviarConToken = (token: string) =>
        next(
            req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            })
        );

    // Reutilizar una sesión ya autenticada.
    const tokenActual = auth.obtenerToken();

    if (tokenActual) {
        return enviarConToken(tokenActual);
    }

    // Si el acceso automático está desactivado,
    // continuar sin credenciales.
    if (!environment.accesoDemoAutomatico) {
        return next(req);
    }

    // Obtener un JWT automáticamente.
    if (!loginEnCurso$) {
        loginEnCurso$ = auth.iniciarSesion(
            CREDENCIALES_DEMO
        ).pipe(
            finalize(() => {
                loginEnCurso$ = null;
            }),
            shareReplay({
                bufferSize: 1,
                refCount: false
            })
        );
    }

    // Esperar la autenticación y enviar la petición.
    return loginEnCurso$.pipe(
        switchMap(datos =>
            enviarConToken(datos.access_token)
        )
    );
};
