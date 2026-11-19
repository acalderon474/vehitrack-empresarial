
/**
 * VEHITRACK EMPRESARIAL
 * Contratos DTO del Dashboard.
 *
 * Referencia:
 * VT-004 y VT-005 de la matriz aprobada.
 *
 * El backend Go proporciona los valores.
 */

/**
 * Parámetros de consulta del Dashboard.
 *
 * Formato de fechas: YYYY-MM-DD.
 */
export interface FiltrosDashboardDto {
    desde: string;
    hasta: string;
}

/**
 * Indicadores operativos.
 *
 * Contrato VT-004.
 */
export interface IndicadoresDashboardDto {
    vehiculos_total: number;
    vehiculos_disponibles: number;
    vehiculos_en_servicio: number;
    solicitudes_pendientes: number;
    recorridos_finalizados: number;
}

/**
 * Períodos establecidos en la matriz.
 */
export type PeriodoFinanciero =
    | 'semana'
    | 'mes'
    | 'trimestre';

/**
 * Resumen económico del Dashboard.
 *
 * Contrato VT-005.
 * Importes expresados en COP.
 */
export interface ResumenFinancieroDashboardDto {
    ingreso_total: number;
    costo_estimado: number;
    costo_real: number;
    margen_estimado: number;
    margen_real: number;
}
