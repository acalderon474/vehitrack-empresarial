
import type {
    DatosCierreRecorrido,
    RecorridoSeguimiento
} from '../models/recorrido';

import type {
    CerrarRecorridoDto,
    RecorridoSeguimientoDto
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

/**
 * Convierte un recorrido de seguimiento
 * recibido de Go al modelo de Angular.
 */
export function recorridoSeguimientoDesdeDto(
    dto: RecorridoSeguimientoDto
): RecorridoSeguimiento {

    const recorrido: RecorridoSeguimiento = {
        id: dto.id,
        codigo: dto.codigo,
        asignacionId: dto.asignacion_id,
        solicitudCodigo: dto.solicitud_codigo,

        origen: dto.origen,
        destino: dto.destino,
        placa: dto.placa,
        conductor: dto.conductor,

        estado: dto.estado,
        fechaInicio: dto.fecha_inicio,

        tarifa: dto.tarifa_pactada,
        costoEstimado: dto.costo_estimado,
        margenEstimado: dto.margen_estimado
    };

    if (dto.fecha_fin !== undefined) {
        recorrido.fechaFin = dto.fecha_fin;
    }

    if (dto.km_reales !== undefined) {
        recorrido.kilometrosReales = dto.km_reales;
    }

    if (dto.costo_real !== undefined) {
        recorrido.costoReal = dto.costo_real;
    }

    if (dto.desviacion_costos !== undefined) {
        recorrido.desviacionCostos = dto.desviacion_costos;
    }

    if (dto.margen_real !== undefined) {
        recorrido.margenReal = dto.margen_real;
    }

    if (dto.gastos !== undefined) {
        recorrido.gastos = {
            combustible: dto.gastos.costo_combustible,
            peajes: dto.gastos.costo_peajes,
            mantenimiento: dto.gastos.costo_mantenimiento,
            conductor: dto.gastos.costo_conductor,
            otros: dto.gastos.otros_gastos
        };
    }

    return recorrido;
}
