
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { ApiService } from './api.service';

import type {
    CredencialesLoginDto,
    DatosSesionDto,
    RespuestaAuthDto
} from '../dto/auth.dto';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly api = inject(ApiService);

    // El token se conserva únicamente en memoria.
    private readonly token = signal<string | null>(null);

    readonly autenticado = this.token.asReadonly();

    /**
     * Iniciar sesión en el backend Go.
     */
    iniciarSesion(
        credenciales: CredencialesLoginDto
    ): Observable<DatosSesionDto> {

        return this.api.post<RespuestaAuthDto<DatosSesionDto>>(
            'api/v2/auth/login',
            credenciales
        ).pipe(
            map(respuesta => {
                if (!respuesta.data?.access_token) {
                    throw new Error(
                        'La API no devolvió un token de acceso válido.'
                    );
                }

                return respuesta.data;
            }),
            tap(datos => {
                this.token.set(datos.access_token);
            })
        );
    }

    /**
     * Obtener el token de la sesión actual.
     */
    obtenerToken(): string | null {
        return this.token();
    }

    /**
     * Limpiar únicamente la sesión local.
     */
    limpiarSesion(): void {
        this.token.set(null);
    }
}
