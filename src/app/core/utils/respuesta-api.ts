import { environment } from '../../../environments/environment';

/**
 * Indica si existe una dirección de API configurada.
 * Sin ella, los módulos trabajan con datos de prueba.
 */
export function apiConfigurada(): boolean {
    return environment.apiBaseUrl.trim() !== '';
}

/**
 * La API Go v2 responde con el formato
 * {"errors": [], "data": {...}}.
 *
 * Devuelve el contenido de "data" o,
 * si la respuesta no viene envuelta,
 * la respuesta tal como llegó.
 */
export function extraerDatos<T>(respuesta: unknown): T {

    if (
        respuesta !== null &&
        typeof respuesta === 'object' &&
        'data' in respuesta &&
        'errors' in respuesta
    ) {
        return (respuesta as { data: T }).data;
    }

    return respuesta as T;
}

/**
 * Los listados de la API pueden llegar como arreglo
 * o como {"elementos": [...], "total": n}.
 */
export function extraerLista<T>(respuesta: unknown): T[] {

    const datos = extraerDatos<unknown>(respuesta);

    if (Array.isArray(datos)) {
        return datos as T[];
    }

    if (
        datos !== null &&
        typeof datos === 'object' &&
        'elementos' in datos &&
        Array.isArray((datos as { elementos: unknown }).elementos)
    ) {
        return (datos as { elementos: T[] }).elementos;
    }

    return [];
}
