
import type { Vehiculo, EstadoVehiculo } from '../models/vehiculo';
import type { VehiculoDto } from '../dto/vehiculo.dto';

import {
    vehiculoDesdeDto,
    vehiculoADto
} from './vehiculo.adapter';

describe('Adaptador de Vehículos', () => {

    const vehiculoDto: VehiculoDto = {
        id: '1',
        placa: 'KLA-452',
        tipo: 'microbus',
        capacidad_pasajeros: 15,
        estado: 'disponible',
        costo_por_km: 1200,
        rendimiento_km_gal: 35,
        costo_despacho: 25000
    };

    it('debe convertir el DTO de Go al modelo Angular', () => {

        const resultado = vehiculoDesdeDto(vehiculoDto);

        expect(resultado).toEqual({
            id: '1',
            placa: 'KLA-452',
            tipo: 'microbus',
            capacidadPasajeros: 15,
            estado: 'disponible',
            costoOperativoPorKm: 1200,
            rendimientoKmGal: 35,
            costoDespacho: 25000
        });

    });

    it('debe convertir el modelo Angular al DTO de Go', () => {

        const vehiculo: Vehiculo = {
            id: '2',
            placa: 'ABC-123',
            tipo: 'camioneta',
            capacidadPasajeros: 7,
            estado: 'ocupado',
            costoOperativoPorKm: 950,
            rendimientoKmGal: 40,
            costoDespacho: 18000
        };

        const resultado = vehiculoADto(vehiculo);

        expect(resultado).toEqual({
            id: '2',
            placa: 'ABC-123',
            tipo: 'camioneta',
            capacidad_pasajeros: 7,
            estado: 'ocupado',
            costo_por_km: 950,
            rendimiento_km_gal: 40,
            costo_despacho: 18000
        });

    });

    it('debe conservar los tres estados aprobados', () => {

        const estados: EstadoVehiculo[] = [
            'disponible',
            'ocupado',
            'mantenimiento'
        ];

        for (const estado of estados) {

            const dto: VehiculoDto = {
                ...vehiculoDto,
                estado
            };

            const modelo = vehiculoDesdeDto(dto);

            expect(modelo.estado).toBe(estado);

            const resultado = vehiculoADto(modelo);

            expect(resultado.estado).toBe(estado);

        }

    });

    it('debe omitir campos opcionales no proporcionados', () => {

        const dto: VehiculoDto = {
            id: '3',
            placa: 'XYZ-789',
            tipo: 'automovil',
            capacidad_pasajeros: 4,
            estado: 'mantenimiento'
        };

        const modelo = vehiculoDesdeDto(dto);

        expect(modelo).not.toHaveProperty('costoOperativoPorKm');
        expect(modelo).not.toHaveProperty('rendimientoKmGal');
        expect(modelo).not.toHaveProperty('costoDespacho');

        const resultado = vehiculoADto(modelo);

        expect(resultado).not.toHaveProperty('costo_por_km');
        expect(resultado).not.toHaveProperty('rendimiento_km_gal');
        expect(resultado).not.toHaveProperty('costo_despacho');

    });

    it('debe conservar valores económicos iguales a cero', () => {

        const dto: VehiculoDto = {
            ...vehiculoDto,
            costo_por_km: 0,
            rendimiento_km_gal: 0,
            costo_despacho: 0
        };

        const modelo = vehiculoDesdeDto(dto);

        expect(modelo.costoOperativoPorKm).toBe(0);
        expect(modelo.rendimientoKmGal).toBe(0);
        expect(modelo.costoDespacho).toBe(0);

        const resultado = vehiculoADto(modelo);

        expect(resultado.costo_por_km).toBe(0);
        expect(resultado.rendimiento_km_gal).toBe(0);
        expect(resultado.costo_despacho).toBe(0);

    });

});
