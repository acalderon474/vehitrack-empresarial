
import type {
    NuevaSolicitud
} from '../models/solicitud';

import type {
    CrearSolicitudDto
} from '../dto/solicitud.dto';

/**
 * Convierte los datos de Angular
 * al contrato JSON empresarial
 * aprobado para registrar solicitudes.
 */
export function solicitudACrearDto(
    solicitud: NuevaSolicitud
): CrearSolicitudDto {

    return {
        nombre_cliente: solicitud.nombreCliente,

        origen: {
            ...solicitud.origen
        },

        destino: {
            ...solicitud.destino
        },

        fecha_servicio: solicitud.fechaHora,

        pasajeros: solicitud.cantidadPasajeros,

        tarifa_pactada: solicitud.tarifa
    };
}
