
import type { AlternativaAsignacionDto } from './asignacion.dto';
import type { ConductorDto } from './conductor.dto';

/**
 * Alternativa con los datos que muestra el diseño además de los
 * del contrato base. Los dos campos extra son opcionales:
 * la matriz aún no confirma que el backend los devuelva.
 */
export interface AlternativaDetalladaDto extends AlternativaAsignacionDto {
    capacidad_pasajeros?: number;
    codigo?: string;
}

/** Respuesta de GET enterprise/requests/{id}/recommendations (VT-012). */
export interface RecomendacionesDetalladasDto {
    solicitud_id: string;
    tarifa_pactada: number;
    alternativas: AlternativaDetalladaDto[];
}

/** Respuesta de POST enterprise/assignments (VT-013). */
export interface ConfirmacionAsignacionDto {
    asignacion_id: string;
    estado: 'confirmada';
    costo_estimado: number;
    estado_vehiculo: string;
    estado_conductor: string;
}

export interface ConductorDisponibleDto extends ConductorDto {
    codigo?: string;
}

/**
 * Respuesta de GET enterprise/drivers?estado=disponible.
 * El formato del listado (elementos y total) se asume igual al de
 * solicitudes: confirmar con Luis.
 */
export interface ListadoConductoresDto {
    elementos: ConductorDisponibleDto[];
    total: number;
}

/**
 * Respuesta de GET enterprise/requests/{id}/assignment.
 * PROPUESTO: la matriz no define cómo consultar una asignación existente.
 */
export interface HistorialAsignacionDto {
    asignacion_id: string;
    solicitud_id: string;

    vehiculo_elegido_id: string;
    conductor_id: string;
    conductor_nombre: string;
    conductor_codigo?: string;

    motivo_seleccion: string;
    recomendada: boolean;

    costo_estimado: number;
    margen_proyectado: number;
    margen_registrado?: number;

    recorrido_codigo?: string;
    estado_servicio: string;

    alternativas: AlternativaDetalladaDto[];
}
