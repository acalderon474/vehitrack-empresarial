
export interface GastosRecorrido {
    combustible: number;
    peajes: number;
    mantenimiento: number;
    conductor: number;
    otros: number;
}

export interface Recorrido {
    id: string;
    asignacionId: string;

    fechaInicio: string;
    fechaFin?: string;

    kilometrosRecorridos?: number;
    ingresoRegistrado?: number;
    gastos?: GastosRecorrido;

    estado: 'en_curso' | 'finalizado';
}
/**
 * Datos necesarios para registrar
 * el cierre económico de un recorrido.
 *
 * La asignación se identifica en la URL.
 * El backend calcula los resultados finales.
 */
export interface DatosCierreRecorrido {
    kilometrosRecorridos: number;
    gastos: GastosRecorrido;
    observaciones?: string;
}
/**
 * Vista de seguimiento de un recorrido
 * (tabla de Recorridos y cierre operativo).
 *
 * Los valores económicos provienen del backend;
 * Angular solo los presenta.
 */
export interface RecorridoSeguimiento {
    id: string;
    codigo: string;
    asignacionId: string;
    solicitudCodigo: string;

    origen: string;
    destino: string;

    vehiculoId: string;
    placa: string;
    conductorId: string;
    conductor: string;

    estado: Recorrido['estado'];
    fechaInicio: string;
    fechaFin?: string;

    tarifa: number;
    costoEstimado: number;
    margenEstimado: number;

    kilometrosReales?: number;
    costoReal?: number;
    desviacionCostos?: number;
    margenReal?: number;
    gastos?: GastosRecorrido;
}
