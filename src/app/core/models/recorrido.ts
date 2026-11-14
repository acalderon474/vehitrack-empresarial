
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
