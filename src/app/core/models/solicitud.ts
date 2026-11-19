
export type EstadoSolicitud =
    | 'pendiente'
    | 'asignada'
    | 'finalizada'
    | 'cancelada';

export interface UbicacionSolicitud {
    direccion: string;
    lat?: number;
    lng?: number;
}

export interface Solicitud {
    id: string;
    codigo?: string;

    nombreCliente: string;

    origen: UbicacionSolicitud;
    destino: UbicacionSolicitud;

    fechaHora: string;
    cantidadPasajeros: number;
    tarifa: number;

    estado: EstadoSolicitud;

    vehiculoAsignadoId?: string;

    kmEstimados?: number;
    duracionEstimadaMin?: number;
}

/**
 * Información necesaria para registrar
 * una nueva solicitud.
 *
 * El backend genera su identificador y
 * establece el estado inicial.
 */
export type NuevaSolicitud = Pick<
    Solicitud,
    | 'nombreCliente'
    | 'origen'
    | 'destino'
    | 'fechaHora'
    | 'cantidadPasajeros'
    | 'tarifa'
>;
