
import type { NuevaSolicitud, Solicitud } from '../models/solicitud';
import type { SolicitudCreadaDto } from '../dto/solicitud.dto';

/**
 * Combina los datos que escribió el usuario con la respuesta
 * del registro (VT-010) para obtener la solicitud completa
 * que usa Angular internamente.
 *
 * El backend solo devuelve id, código, estado y estimaciones;
 * el resto de los campos se conserva de lo enviado.
 */
export function solicitudDesdeCreadaDto(
    dto: SolicitudCreadaDto,
    datos: NuevaSolicitud
): Solicitud {

    const solicitud: Solicitud = {
        id: dto.id,
        codigo: dto.codigo,

        nombreCliente: datos.nombreCliente,

        origen: { ...datos.origen },
        destino: { ...datos.destino },

        fechaHora: datos.fechaHora,
        cantidadPasajeros: datos.cantidadPasajeros,
        tarifa: datos.tarifa,

        estado: dto.estado
    };

    if (dto.km_estimados !== undefined) {
        solicitud.kmEstimados = dto.km_estimados;
    }

    if (dto.duracion_estimada_min !== undefined) {
        solicitud.duracionEstimadaMin = dto.duracion_estimada_min;
    }

    return solicitud;
}
