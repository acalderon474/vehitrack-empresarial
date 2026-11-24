import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

let tokenEnMemoria: string | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // No interceptar la propia petición de login ni rutas sin API configurada
    if (req.url.includes('/auth/login') || !environment.apiBaseUrl.trim()) {
        return next(req);
    }

    // Buscar token en localStorage (si otro compañero ya hizo el login) o en memoria
    const tokenGuardado =
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        tokenEnMemoria;

    if (tokenGuardado) {
        const reqConToken = req.clone({
            setHeaders: { Authorization: `Bearer ${tokenGuardado}` }
        });
        return next(reqConToken);
    }

    // Si no hay token, hace login automático con las credenciales de prueba de Postman
    const http = inject(HttpClient);
    const baseUrl = environment.apiBaseUrl.trim().replace(/\/+$/, '');

    return http
        .post<any>(`${baseUrl}/auth/login`, {
            email: 'despachador@empresa.com',
            password: 'UnaClaveSeguraDe12+',
            tenant_id: '00000000-0000-0000-0000-000000000001'
        })
        .pipe(
            map(res => res?.data?.access_token || res?.data?.token || res?.token),
            switchMap(nuevoToken => {
                if (!nuevoToken) {
                    return throwError(() => new Error('No se recibió token del login'));
                }
                tokenEnMemoria = nuevoToken;
                const reqConToken = req.clone({
                    setHeaders: { Authorization: `Bearer ${nuevoToken}` }
                });
                return next(reqConToken);
            }),
            catchError(err => throwError(() => err))
        );
};
