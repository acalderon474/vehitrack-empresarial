
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensaje para el usuario según el error HTTP recibido.
 * `accion` completa el mensaje genérico, por ejemplo
 * "registrar la solicitud" o "cancelar la solicitud".
 *
 * `mensajeConflicto` permite explicar mejor el error 409 en cada pantalla.
 *
 * El formato de error del backend aún no está definido en la matriz,
 * por eso se distingue solo por el código de estado.
 */
export function mensajeDeError(
    fallo: unknown,
    accion: string,
    mensajeConflicto = 'La solicitud cambió y ya no admite esta operación. Actualiza el listado.'
): string {

    if (fallo instanceof HttpErrorResponse) {

        switch (fallo.status) {
            case 0:
                return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
            case 401:
                return 'Tu sesión venció o no has iniciado sesión. Ingresa de nuevo.';
            case 403:
                return 'No tienes permiso para realizar esta operación.';
            case 404:
                return 'La solicitud ya no existe. Actualiza el listado.';
            case 409:
                return mensajeConflicto;
            case 400:
            case 422:
                return 'El servidor rechazó los datos de la solicitud. Revisa la información e inténtalo de nuevo.';
            default:
                if (fallo.status >= 500) {
                    return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
                }
        }
    }

    return `No se pudo ${accion}. Inténtalo de nuevo.`;
}
