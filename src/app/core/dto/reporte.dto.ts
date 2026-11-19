
/**
 * VEHITRACK EMPRESARIAL
 * Contrato VT-015 — Reportes de rentabilidad.
 *
 * Basado en las columnas I, J y K
 * de la matriz aprobada por Luis.
 */

/**
 * Parámetros de consulta del reporte.
 * Fechas en formato YYYY-MM-DD.
 */
export interface FiltrosReporteDto {
    desde: string;
    hasta: string;

    vehiculo_id?: string;
    conductor_id?: string;
}

/**
 * Resumen económico del período consultado.
 * Valores monetarios expresados en COP.
 */
export interface ResumenRentabilidadDto {
    tarifa_total: number;
    costo_estimado_total: number;
    costo_real_total: number;
    desviacion: number;
}

/**
 * Resultado económico de un recorrido.
 */
export interface RecorridoRentabilidadDto {
    codigo: string;
    placa: string;

    margen_estimado: number;
    margen_real: number;
}

/**
 * Respuesta del endpoint VT-015.
 */
export interface ReporteRentabilidadDto {
    resumen: ResumenRentabilidadDto;
    recorridos: RecorridoRentabilidadDto[];
}
