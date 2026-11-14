
export interface Solicitud {
    id: string;
    origen: string;
    destino: string;
    fechaHora: string;
    cantidadPasajeros: number;
    tarifa: number;
    estado: 'pendiente' | 'asignada' | 'finalizada' | 'cancelada';
    vehiculoAsignadoId?: string;
}
