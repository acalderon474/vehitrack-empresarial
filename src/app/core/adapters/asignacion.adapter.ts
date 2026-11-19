
import type { Asignacion } from '../models/asignacion';
import type { AsignacionDto } from '../dto/asignacion.dto';

/**
 * Convierte un DTO empresarial de Go
 * al modelo utilizado internamente por Angular.
 */
export function asignacionDesdeDto(
    dto: AsignacionDto
): Asignacion {

    return {
        id: dto.id,
        solicitudId: dto.solicitud_id,
        vehiculoId: dto.vehiculo_id,
        conductorId: dto.conductor_id,

        kilometrosVaciosEstimados: dto.km_vacios,
        costoEstimado: dto.costo_estimado,
        margenEstimado: dto.margen_proyectado,

        justificacion: dto.explicacion_criterios,
        estado: dto.estado
    };
}

/**
 * Convierte una asignación Angular
 * al contrato JSON empresarial.
 *
 * No debe utilizarse para confirmar asignaciones:
 * esa operación utiliza ConfirmarAsignacionDto.
 */
export function asignacionADto(
    asignacion: Asignacion
): AsignacionDto {

    return {
        id: asignacion.id,
        solicitud_id: asignacion.solicitudId,
        vehiculo_id: asignacion.vehiculoId,
        conductor_id: asignacion.conductorId,

        km_vacios: asignacion.kilometrosVaciosEstimados,
        costo_estimado: asignacion.costoEstimado,
        margen_proyectado: asignacion.margenEstimado,

        explicacion_criterios: asignacion.justificacion,
        estado: asignacion.estado
    };
}
