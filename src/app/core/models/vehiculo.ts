
export interface Vehiculo {
    id: string;
    placa: string;
    tipo: string;
    capacidadPasajeros: number;
    disponible: boolean;
    costoOperativoPorKm?: number;
}
