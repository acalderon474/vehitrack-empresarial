
import type {
    DatosCierreRecorrido
} from '../models/recorrido';

import type {
    CerrarRecorridoDto
} from '../dto/recorrido.dto';

/**
 * Convierte los gastos reales del recorrido
 * al contrato JSON aprobado para la API Go.
 *
 * No calcula costos ni márgenes:
 * esas operaciones corresponden al backend.
 */
export function cierreRecorridoADto(
    datos: DatosCierreRecorrido
): CerrarRecorridoDto {

    const dto: CerrarRecorridoDto = {
        km_reales: datos.kilometrosRecorridos,

        costo_combustible: datos.gastos.combustible,
        costo_peajes: datos.gastos.peajes,
        costo_mantenimiento: datos.gastos.mantenimiento,
        costo_conductor: datos.gastos.conductor,
        otros_gastos: datos.gastos.otros
    };

    if (datos.observaciones !== undefined) {
        dto.observaciones = datos.observaciones;
    }

    return dto;
}
