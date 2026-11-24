
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface RespuestaApi<T> {
    errors?: unknown[];
    data?: T;
}

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

     private extraerData<T>(respuesta: RespuestaApi<T> | T): T {
        if (respuesta && typeof respuesta === 'object' && 'data' in respuesta) {
            return (respuesta as RespuestaApi<T>).data as T;
        }
        return respuesta as T;
    }

    // Consultar información.
    get<T>(ruta: string): Observable<T> {
        return this.http
            .get<RespuestaApi<T> | T>(this.construirUrl(ruta))
            .pipe(map(res => this.extraerData(res)));
    }

    // Registrar información.
    post<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http
            .post<RespuestaApi<T> | T>(this.construirUrl(ruta), datos)
            .pipe(map(res => this.extraerData(res)));
    }

    // Actualizar parcialmente información.
    patch<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http
            .patch<RespuestaApi<T> | T>(this.construirUrl(ruta), datos)
            .pipe(map(res => this.extraerData(res)));
    }

    // Actualizar completamente información.
    put<T>(ruta: string, datos: unknown): Observable<T> {
        return this.http
            .put<RespuestaApi<T> | T>(this.construirUrl(ruta), datos)
            .pipe(map(res => this.extraerData(res)));
    }

}
