import type { Vehiculo } from '../models/vehiculo';
import type { VehiculoDto } from '../dto/vehiculo.dto';

/**
 * Convierte la respuesta JSON de Go
 * al modelo utilizado por Angular.
 */
export function vehiculoDesdeDto(dto: VehiculoDto): Vehiculo {
    const vehiculo: Vehiculo = {
        id: dto.id,
        placa: dto.placa,
        tipo: dto.tipo,
        capacidadPasajeros: dto.capacidad_pasajeros,
        estado: dto.estado,
    };

    if (dto.costo_por_km !== undefined) {
        vehiculo.costoOperativoPorKm = dto.costo_por_km;
    }

    if (dto.rendimiento_km_gal !== undefined) {
        vehiculo.rendimientoKmGal = dto.rendimiento_km_gal;
    }

    if (dto.costo_despacho !== undefined) {
        vehiculo.costoDespacho = dto.costo_despacho;
    }

    return vehiculo;
}

/**
 * Convierte un vehículo de Angular
 * al contrato JSON propuesto para Go.
 */
export function vehiculoADto(vehiculo: Vehiculo): VehiculoDto {
    const dto: VehiculoDto = {
        id: vehiculo.id,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
        capacidad_pasajeros: vehiculo.capacidadPasajeros,
        estado: vehiculo.estado,
    };

    if (vehiculo.costoOperativoPorKm !== undefined) {
        dto.costo_por_km = vehiculo.costoOperativoPorKm;
    }

    if (vehiculo.rendimientoKmGal !== undefined) {
        dto.rendimiento_km_gal = vehiculo.rendimientoKmGal;
    }

    if (vehiculo.costoDespacho !== undefined) {
        dto.costo_despacho = vehiculo.costoDespacho;
    }

    return dto;
}
