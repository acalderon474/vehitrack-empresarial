/**
 * Contrato JSON propuesto para vehículos empresariales.
 *
 * Los nombres siguen la convención acordada:
 * español, minúsculas y snake_case.
 *
 * Pendiente de confirmación definitiva
 * con el backend Go.
 */
import type {
    EstadoVehiculo
} from '../models/vehiculo';
export interface VehiculoDto {

    id: string;

    placa: string;

    tipo: string;

    capacidad_pasajeros: number;

    estado: EstadoVehiculo;

    costo_por_km?: number;

    rendimiento_km_gal?: number;

    costo_despacho?: number;

}
