
import type { ConfirmarAsignacionDto } from '../dto/asignacion.dto';

import type {
    AlternativaDetalladaDto,
    ConductorDisponibleDto,
    ConfirmacionAsignacionDto,
    HistorialAsignacionDto,
    ListadoConductoresDto,
    RecomendacionesDetalladasDto
} from '../dto/asignacion-flujo.dto';

import type {
    AlternativaAsignacion,
    ConductorDisponible,
    ConfirmacionAsignacion,
    DatosConfirmacionAsignacion,
    HistorialAsignacion,
    RecomendacionesAsignacion
} from '../models/asignacion-flujo';

import { conductorDesdeDto } from './conductor.adapter';

export function alternativaDesdeDto(
    dto: AlternativaDetalladaDto
): AlternativaAsignacion {

    const alternativa: AlternativaAsignacion = {
        vehiculoId: dto.vehiculo_id,
        placa: dto.placa,

        kmVacios: dto.km_vacios,
        kmTotalesEstimados: dto.km_totales_estimados,

        costoEstimado: dto.costo_estimado,
        margenProyectado: dto.margen_proyectado,
        porcentajeMargen: dto.porcentaje_margen,

        recomendado: dto.recomendado,
        explicacionCriterios: dto.explicacion_criterios
    };

    if (dto.capacidad_pasajeros !== undefined) {
        alternativa.capacidadPasajeros = dto.capacidad_pasajeros;
    }
    if (dto.codigo !== undefined) {
        alternativa.codigoVehiculo = dto.codigo;
    }

    return alternativa;
}

export function recomendacionesDesdeDto(
    dto: RecomendacionesDetalladasDto
): RecomendacionesAsignacion {

    return {
        solicitudId: dto.solicitud_id,
        tarifaPactada: dto.tarifa_pactada,
        alternativas: dto.alternativas.map(alternativaDesdeDto)
    };
}

export function conductorDisponibleDesdeDto(
    dto: ConductorDisponibleDto
): ConductorDisponible {

    const conductor: ConductorDisponible = conductorDesdeDto(dto);

    if (dto.codigo !== undefined) {
        conductor.codigo = dto.codigo;
    }

    return conductor;
}

export function conductoresDesdeDto(
    dto: ListadoConductoresDto
): ConductorDisponible[] {
    return dto.elementos.map(conductorDisponibleDesdeDto);
}

/** Cuerpo de POST enterprise/assignments. */
export function confirmarADto(
    datos: DatosConfirmacionAsignacion
): ConfirmarAsignacionDto {

    return {
        solicitud_id: datos.solicitudId,
        vehiculo_id: datos.vehiculoId,
        conductor_id: datos.conductorId,
        motivo_seleccion: datos.motivoSeleccion
    };
}

export function confirmacionDesdeDto(
    dto: ConfirmacionAsignacionDto
): ConfirmacionAsignacion {

    return {
        asignacionId: dto.asignacion_id,
        estado: dto.estado,
        costoEstimado: dto.costo_estimado,
        estadoVehiculo: dto.estado_vehiculo,
        estadoConductor: dto.estado_conductor
    };
}

export function historialDesdeDto(
    dto: HistorialAsignacionDto
): HistorialAsignacion {

    const historial: HistorialAsignacion = {
        asignacionId: dto.asignacion_id,
        solicitudId: dto.solicitud_id,

        vehiculoElegidoId: dto.vehiculo_elegido_id,
        conductorId: dto.conductor_id,
        conductorNombre: dto.conductor_nombre,

        motivoSeleccion: dto.motivo_seleccion,
        esRecomendada: dto.recomendada,

        costoEstimado: dto.costo_estimado,
        margenPrevisto: dto.margen_proyectado,

        estadoServicio: dto.estado_servicio,

        alternativas: dto.alternativas.map(alternativaDesdeDto)
    };

    if (dto.conductor_codigo !== undefined) {
        historial.conductorCodigo = dto.conductor_codigo;
    }
    if (dto.margen_registrado !== undefined) {
        historial.margenRegistrado = dto.margen_registrado;
    }
    if (dto.recorrido_codigo !== undefined) {
        historial.codigoRecorrido = dto.recorrido_codigo;
    }

    return historial;
}
