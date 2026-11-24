
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class Login {

    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    email = '';
    password = '';
    tenantId = '';

    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);

    iniciarSesion(): void {

        if (
            !this.email.trim() ||
            !this.password ||
            !this.tenantId.trim()
        ) {
            this.error.set('Todos los campos son obligatorios.');
            return;
        }

        if (this.cargando()) {
            return;
        }

        this.cargando.set(true);
        this.error.set(null);

        this.auth.iniciarSesion({
            email: this.email.trim(),
            password: this.password,
            tenant_id: this.tenantId.trim()
        }).subscribe({

            next: () => {
                this.cargando.set(false);
                this.password = '';

                void this.router.navigateByUrl('/dashboard');
            },

            error: (err: HttpErrorResponse | Error) => {
                this.cargando.set(false);

                if (err instanceof HttpErrorResponse) {

                    if (err.status === 401) {
                        this.error.set('Credenciales incorrectas.');
                    } else if (err.status === 0) {
                        this.error.set(
                            'No fue posible conectar con la API. Verifica la red y la configuración CORS.'
                        );
                    } else {
                        this.error.set(
                            'No fue posible iniciar sesión. Intenta nuevamente.'
                        );
                    }

                } else {
                    this.error.set('La respuesta de autenticación no es válida.');
                }
            }

        });
    }
}
