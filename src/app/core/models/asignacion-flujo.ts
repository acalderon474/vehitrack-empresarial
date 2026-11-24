
import type { Conductor } from './conductor';

/** Un vehículo evaluado para una solicitud (VT-012). */
export interface AlternativaAsignacion {
    vehiculoId: string;
    placa: string;

    kmVacios: number;
    kmTotalesEstimados: number;

    costoEstimado: number;
    margenProyectado: number;
    porcentajeMargen: number;

    recomendado: boolean;
    explicacionCriterios: string;

    /** Puestos del vehículo (el diseño los muestra; campo opcional). */
    capacidadPasajeros?: number;

    /** Código interno, por ejemplo "V-103" (campo opcional). */
    codigoVehiculo?: string;
}

export interface RecomendacionesAsignacion {
    solicitudId: string;
    tarifaPactada: number;
    alternativas: AlternativaAsignacion[];
}

/** Conductor que se puede elegir al confirmar. */
export interface ConductorDisponible extends Conductor {
    /** Código interno, por ejemplo "C-003" (campo opcional). */
    codigo?: string;
}

/** Datos que escribe el coordinador para confirmar (VT-013). */
export interface DatosConfirmacionAsignacion {
    solicitudId: string;
    vehiculoId: string;
    conductorId: string;
    motivoSeleccion: string;
}

export interface ConfirmacionAsignacion {
    asignacionId: string;
    estado: 'confirmada';
    costoEstimado: number;
    estadoVehiculo: string;
    estadoConductor: string;
}

/**
 * Asignación ya registrada, con las alternativas que se compararon
 * (vista de historial del diseño). Contrato PROPUESTO.
 */
export interface HistorialAsignacion {
    asignacionId: string;
    solicitudId: string;

    vehiculoElegidoId: string;
    conductorId: string;
    conductorNombre: string;
    conductorCodigo?: string;

    motivoSeleccion: string;
    esRecomendada: boolean;

    costoEstimado: number;
    margenPrevisto: number;
    margenRegistrado?: number;

    codigoRecorrido?: string;
    estadoServicio: string;

    alternativas: AlternativaAsignacion[];
}
