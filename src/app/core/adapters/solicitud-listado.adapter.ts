
import type {
    ActualizarSolicitudDto,
    ListadoSolicitudesDto,
    SolicitudResumenDto
} from '../dto/solicitud-listado.dto';

import type {
    CambiosSolicitud,
    FiltrosSolicitudes,
    ListadoSolicitudes,
    SolicitudResumen
} from '../models/solicitud-resumen';

/** Convierte un elemento del listado de Go al modelo de Angular. */
export function solicitudResumenDesdeDto(
    dto: SolicitudResumenDto
): SolicitudResumen {

    const solicitud: SolicitudResumen = {
        id: dto.id,
        codigo: dto.codigo,
        cantidadPasajeros: dto.pasajeros,
        tarifa: dto.tarifa_pactada,
        estado: dto.estado
    };

    if (dto.nombre_cliente !== undefined) {
        solicitud.nombreCliente = dto.nombre_cliente;
    }
    if (dto.fecha_servicio !== undefined) {
        solicitud.fechaHora = dto.fecha_servicio;
    }
    if (dto.origen !== undefined) {
        solicitud.origen = { ...dto.origen };
    }
    if (dto.destino !== undefined) {
        solicitud.destino = { ...dto.destino };
    }
    if (dto.km_estimados !== undefined) {
        solicitud.kmEstimados = dto.km_estimados;
    }
    if (dto.duracion_estimada_min !== undefined) {
        solicitud.duracionEstimadaMin = dto.duracion_estimada_min;
    }
    if (dto.motivo_cancelacion !== undefined) {
        solicitud.motivoCancelacion = dto.motivo_cancelacion;
    }
    if (dto.recorrido_codigo !== undefined) {
        solicitud.codigoRecorrido = dto.recorrido_codigo;
    }

    return solicitud;
}

export function listadoSolicitudesDesdeDto(
    dto: ListadoSolicitudesDto
): ListadoSolicitudes {

    return {
        elementos: dto.elementos.map(solicitudResumenDesdeDto),
        total: dto.total
    };
}

/**
 * Construye la cadena de consulta del listado:
 * "" si no hay filtros, o "?estado=...&fecha=...".
 */
export function filtrosAConsulta(filtros: FiltrosSolicitudes): string {

    const parametros = new URLSearchParams();

    if (filtros.estado !== undefined) {
        parametros.set('estado', filtros.estado);
    }
    if (filtros.fecha !== undefined) {
        parametros.set('fecha', filtros.fecha);
    }

    const texto = parametros.toString();

    return texto === '' ? '' : `?${texto}`;
}

/** Convierte los cambios de una edición al JSON de Go (solo lo enviado). */
export function cambiosADto(
    cambios: CambiosSolicitud
): ActualizarSolicitudDto {

    const dto: ActualizarSolicitudDto = {};

    if (cambios.nombreCliente !== undefined) {
        dto.nombre_cliente = cambios.nombreCliente;
    }
    if (cambios.origen !== undefined) {
        dto.origen = { ...cambios.origen };
    }
    if (cambios.destino !== undefined) {
        dto.destino = { ...cambios.destino };
    }
    if (cambios.fechaHora !== undefined) {
        dto.fecha_servicio = cambios.fechaHora;
    }
    if (cambios.cantidadPasajeros !== undefined) {
        dto.pasajeros = cambios.cantidadPasajeros;
    }
    if (cambios.tarifa !== undefined) {
        dto.tarifa_pactada = cambios.tarifa;
    }

    return dto;
}
