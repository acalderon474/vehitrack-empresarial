
/**
 * Ubicación utilizada por las solicitudes empresariales.
 * Las coordenadas pueden estar ausentes antes
 * de completar la geocodificación.
 */
export interface UbicacionSolicitudDto {
    direccion: string;
    lat?: number;
    lng?: number;
}

/**
 * Datos enviados al registrar una solicitud.
 * Contrato definido en la matriz Product Owner.
 */
export interface CrearSolicitudDto {
    nombre_cliente: string;
    origen: UbicacionSolicitudDto;
    destino: UbicacionSolicitudDto;
    fecha_servicio: string;
    pasajeros: number;
    tarifa_pactada: number;
}

/**
 * Respuesta propuesta del registro de solicitud.
 * Su formato real se comprobará con la API Go.
 */
export interface SolicitudCreadaDto {
    id: string;
    codigo: string;
    km_estimados?: number;
    duracion_estimada_min?: number;
    estado: 'pendiente' | 'asignada' | 'finalizada' | 'cancelada';
}
