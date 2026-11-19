
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