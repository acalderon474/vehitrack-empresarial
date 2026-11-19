
import type { Asignacion } from '../models/asignacion';

/**
 * Representación JSON de una asignación empresarial.
 */
export interface AsignacionDto {
    id: string;
    solicitud_id: string;
    vehiculo_id: string;
    conductor_id: string;

    km_vacios: number;
    costo_estimado: number;
    margen_proyectado: number;

    explicacion_criterios: string;
    estado: Asignacion['estado'];
}

/**
 * Alternativa económica evaluada por Go.
 */
export interface AlternativaAsignacionDto {
    vehiculo_id: string;
    placa: string;

    km_vacios: number;
    km_totales_estimados: number;

    costo_estimado: number;
    margen_proyectado: number;
    porcentaje_margen: number;

    recomendado: boolean;
    explicacion_criterios: string;
}

/**
 * Respuesta del servicio de recomendaciones.
 */
export interface RecomendacionesAsignacionDto {
    solicitud_id: string;
    tarifa_pactada: number;
    alternativas: AlternativaAsignacionDto[];
}

/**
 * Datos para confirmar una asignación.
 * El backend verifica nuevamente disponibilidad
 * y recalcula los costos.
 */
export interface ConfirmarAsignacionDto {
    solicitud_id: string;
    vehiculo_id: string;
    conductor_id: string;
    motivo_seleccion: string;
}
