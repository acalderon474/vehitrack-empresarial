
import type {
    EstadoSolicitud,
    NuevaSolicitud,
    UbicacionSolicitud
} from './solicitud';

/**
 * Solicitud tal como aparece en el listado (VT-011).
 * Solo los primeros cinco campos están garantizados por la matriz.
 */
export interface SolicitudResumen {
    id: string;
    codigo: string;
    cantidadPasajeros: number;
    tarifa: number;
    estado: EstadoSolicitud;

    nombreCliente?: string;
    fechaHora?: string;
    origen?: UbicacionSolicitud;
    destino?: UbicacionSolicitud;
    kmEstimados?: number;
    duracionEstimadaMin?: number;
    motivoCancelacion?: string;

    /** Código del recorrido vinculado, si ya existe (campo PROPUESTO). */
    codigoRecorrido?: string;
}

export interface ListadoSolicitudes {
    elementos: SolicitudResumen[];
    total: number;
}

/** Filtros que acepta el backend (fecha en formato AAAA-MM-DD). */
export interface FiltrosSolicitudes {
    estado?: EstadoSolicitud;
    fecha?: string;
}

/** Campos que se pueden cambiar al editar una solicitud. */
export type CambiosSolicitud = Partial<NuevaSolicitud>;
