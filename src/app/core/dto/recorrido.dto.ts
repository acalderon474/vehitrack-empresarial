
/**
 * Contrato empresarial VT-014.
 *
 * Datos que Angular envía a Go
 * para registrar el cierre económico
 * de un recorrido.
 *
 * El ID de la asignación se envía
 * en la URL del endpoint.
 */
export interface CerrarRecorridoDto {
    km_reales: number;

    costo_combustible: number;
    costo_peajes: number;
    costo_mantenimiento: number;
    costo_conductor: number;
    otros_gastos: number;

    observaciones?: string;
}

/**
 * Resultado económico que devuelve Go.
 *
 * Los cálculos deben ser realizados
 * por el backend, no por Angular.
 */
export interface ResultadoCierreRecorridoDto {
    recorrido_id: string;

    tarifa_pactada: number;
    costo_estimado: number;
    costo_real: number;

    desviacion_costos: number;
    margen_real: number;
    porcentaje_margen_real: number;
}
