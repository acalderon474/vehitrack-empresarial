
import { Observable, defer, delay, of } from 'rxjs';

/** Tiempo simulado de respuesta del servidor (ms). */
export const RETARDO_SIMULADO_MS = 300;

/**
 * Ejecuta una operación simulada con un pequeño retardo.
 * Si la operación lanza un error (por ejemplo un 404 simulado),
 * se entrega como error del Observable, igual que en HTTP real.
 */
export function simular<T>(operacion: () => T): Observable<T> {
    return defer(() => of(operacion())).pipe(delay(RETARDO_SIMULADO_MS));
}
