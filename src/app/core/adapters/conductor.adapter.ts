
import type { Conductor } from '../models/conductor';
import type { ConductorDto } from '../dto/conductor.dto';

/**
 * Convierte los datos JSON de Go
 * al modelo utilizado por Angular.
 */
export function conductorDesdeDto(
    dto: ConductorDto
): Conductor {

    const conductor: Conductor = {
        id: dto.id,
        nombreCompleto: dto.nombre_completo,
        categoriaLicencia: dto.categoria_licencia,
        estado: dto.estado
    };

    if (dto.vehiculo_asignado_id !== undefined) {
        conductor.vehiculoId = dto.vehiculo_asignado_id;
    }

    if (dto.vencimiento_licencia !== undefined) {
        conductor.vencimientoLicencia = dto.vencimiento_licencia;
    }

    return conductor;
}

/**
 * Convierte el modelo Angular
 * al contrato JSON de Go.
 */
export function conductorADto(
    conductor: Conductor
): ConductorDto {

    const dto: ConductorDto = {
        id: conductor.id,
        nombre_completo: conductor.nombreCompleto,
        categoria_licencia: conductor.categoriaLicencia,
        estado: conductor.estado
    };

    if (conductor.vehiculoId !== undefined) {
        dto.vehiculo_asignado_id = conductor.vehiculoId;
    }

    if (conductor.vencimientoLicencia !== undefined) {
        dto.vencimiento_licencia = conductor.vencimientoLicencia;
    }

    return dto;
}
