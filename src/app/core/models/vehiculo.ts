
export type EstadoVehiculo =
    | 'disponible'
    | 'ocupado'
    | 'mantenimiento';

export interface Vehiculo {
    id: string;
    placa: string;
    tipo: string;
    capacidadPasajeros: number;
    estado: EstadoVehiculo;
    costoOperativoPorKm?: number;
    rendimientoKmGal?: number;
    costoDespacho?: number;
}
