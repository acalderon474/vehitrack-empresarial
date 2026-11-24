
import type {
    AbstractControl,
    ValidationErrors
} from '@angular/forms';

/** Rechaza textos formados solo por espacios. */
export function noVacio(
    control: AbstractControl
): ValidationErrors | null {

    const valor: unknown = control.value;

    return typeof valor === 'string' && valor.trim() === ''
        ? { noVacio: true }
        : null;
}

/** Acepta solo números enteros (los montos y pasajeros son enteros). */
export function entero(
    control: AbstractControl
): ValidationErrors | null {

    const valor: unknown = control.value;

    if (valor === null || valor === undefined || valor === '') {
        return null;
    }

    return Number.isInteger(Number(valor)) ? null : { entero: true };
}

/** La fecha y hora del servicio debe estar en el futuro. */
export function noPasado(
    control: AbstractControl
): ValidationErrors | null {

    const valor: unknown = control.value;

    if (typeof valor !== 'string' || valor === '') {
        return null;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return { fechaInvalida: true };
    }

    return fecha.getTime() <= Date.now() ? { fechaPasada: true } : null;
}

/**
 * Las coordenadas son opcionales, pero si se escribe una
 * (latitud o longitud) hay que escribir la otra.
 */
export function coordenadasCompletas(
    grupo: AbstractControl
): ValidationErrors | null {

    const lat: unknown = grupo.get('lat')?.value;
    const lng: unknown = grupo.get('lng')?.value;

    const hayLat = lat !== null && lat !== undefined && lat !== '';
    const hayLng = lng !== null && lng !== undefined && lng !== '';

    return hayLat === hayLng ? null : { coordenadasIncompletas: true };
}
