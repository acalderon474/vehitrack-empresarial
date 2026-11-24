
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { ApiService } from './api.service';

import type {
    CredencialesLoginDto,
    DatosSesionDto
} from '../dto/auth.dto';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly api = inject(ApiService);

    private readonly token = signal<string | null>(null);

    readonly autenticado = this.token.asReadonly();

    iniciarSesion(
        credenciales: CredencialesLoginDto
    ): Observable<DatosSesionDto> {

        return this.api.post<DatosSesionDto>(
            'auth/login',
            credenciales
        ).pipe(
            map(datos => {
                if (!datos?.access_token) {
                    throw new Error(
                        'La API no devolvió un token de acceso válido.'
                    );
                }

                return datos;
            }),
            tap(datos => {
                this.token.set(datos.access_token);
            })
        );
    }

    obtenerToken(): string | null {
        return this.token();
    }

    limpiarSesion(): void {
        this.token.set(null);
    }
}
