
import type { CrearSolicitudDto, UbicacionSolicitudDto } from './solicitud.dto';

export type EstadoSolicitudDto =
    | 'pendiente'
    | 'asignada'
    | 'finalizada'
    | 'cancelada';

/**
 * Elemento del listado de solicitudes (VT-011).
 *
 * La matriz solo garantiza id, codigo, pasajeros, tarifa_pactada y estado.
 * Los demás campos son opcionales: si el backend no los devuelve,
 * la pantalla muestra un guion.
 */
export interface SolicitudResumenDto {
    id: string;
    codigo: string;
    pasajeros: number;
    tarifa_pactada: number;
    estado: EstadoSolicitudDto;

    nombre_cliente?: string;
    fecha_servicio?: string;
    origen?: UbicacionSolicitudDto;
    destino?: UbicacionSolicitudDto;
    km_estimados?: number;
    duracion_estimada_min?: number;
    motivo_cancelacion?: string;

    /**
     * Código del recorrido vinculado (por ejemplo "R-7825"), si ya existe.
     * PROPUESTO: el diseño muestra esta columna pero la matriz aún no
     * define el campo; confirmar con Luis.
     */
    recorrido_codigo?: string;
}

/** Respuesta de GET enterprise/requests (VT-011). */
export interface ListadoSolicitudesDto {
    elementos: SolicitudResumenDto[];
    total: number;
}

/**
 * Cuerpo de PATCH enterprise/requests/{id}/status (VT-011, PROPUESTO).
 * El motivo es obligatorio al cancelar.
 */
export interface CambiarEstadoSolicitudDto {
    estado: EstadoSolicitudDto;
    motivo_cancelacion?: string;
}

/**
 * Cuerpo de PATCH enterprise/requests/{id} (VT-011, PROPUESTO).
 * La matriz NO define aún el endpoint de edición: confirmar con Luis.
 */
export type ActualizarSolicitudDto = Partial<CrearSolicitudDto>;
