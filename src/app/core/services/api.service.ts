
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiBaseUrl;

    // Construye la dirección de cada servicio.
    private construirUrl(ruta: string): string {

        const base = this.baseUrl.trim().replace(/\/+$/, '');

        if (!base) {
            throw new Error(
                'La dirección de la API todavía no está configurada.'
            );
        }

        const rutaLimpia = ruta.replace(/^\/+/, '');

        return `${base}/${rutaLimpia}`;
    }

    // Consultar información.
    get<T>(ruta: string): Observable<T> {
        return this.http.get<T>(this.construirUrl(ruta));
    }

    // Registrar información.
    post<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http.post<T>(
            this.construirUrl(ruta),
            datos
        );
    }

    // Actualizar parcialmente información.
    patch<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http.patch<T>(
            this.construirUrl(ruta),
            datos
        );
    }

    // Actualizar completamente información.
    put<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http.put<T>(
            this.construirUrl(ruta),
            datos
        );
    }

}
