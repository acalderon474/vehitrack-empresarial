
import type {
    Conductor,
    EstadoConductor
} from '../models/conductor';

import type { ConductorDto } from '../dto/conductor.dto';

import {
    conductorDesdeDto,
    conductorADto
} from './conductor.adapter';

describe('Adaptador de Conductores', () => {

    const conductorDto: ConductorDto = {
        id: '1',
        nombre_completo: 'Carlos Pérez',
        categoria_licencia: 'C2',
        estado: 'disponible',
        vehiculo_asignado_id: 'V001',
        vencimiento_licencia: '2027-12-31'
    };

    it('debe convertir el DTO de Go al modelo Angular', () => {

        const resultado = conductorDesdeDto(conductorDto);

        expect(resultado).toEqual({
            id: '1',
            nombreCompleto: 'Carlos Pérez',
            categoriaLicencia: 'C2',
            estado: 'disponible',
            vehiculoId: 'V001',
            vencimientoLicencia: '2027-12-31'
        });

    });

    it('debe convertir el modelo Angular al DTO de Go', () => {

        const conductor: Conductor = {
            id: '2',
            nombreCompleto: 'Juan Rodríguez',
            categoriaLicencia: 'C3',
            estado: 'asignado',
            vehiculoId: 'V002',
            vencimientoLicencia: '2028-06-15'
        };

        const resultado = conductorADto(conductor);

        expect(resultado).toEqual({
            id: '2',
            nombre_completo: 'Juan Rodríguez',
            categoria_licencia: 'C3',
            estado: 'asignado',
            vehiculo_asignado_id: 'V002',
            vencimiento_licencia: '2028-06-15'
        });

    });

    it('debe conservar los tres estados de conductor', () => {

        const estados: EstadoConductor[] = [
            'disponible',
            'asignado',
            'descanso'
        ];

        for (const estado of estados) {

            const dto: ConductorDto = {
                ...conductorDto,
                estado
            };

            const modelo = conductorDesdeDto(dto);

            expect(modelo.estado).toBe(estado);
            expect(conductorADto(modelo).estado).toBe(estado);

        }

    });

    it('debe omitir los campos opcionales ausentes', () => {

        const dto: ConductorDto = {
            id: '3',
            nombre_completo: 'Ana Gómez',
            categoria_licencia: 'C2',
            estado: 'descanso'
        };

        const modelo = conductorDesdeDto(dto);

        expect(modelo).not.toHaveProperty('vehiculoId');
        expect(modelo).not.toHaveProperty('vencimientoLicencia');

        const resultado = conductorADto(modelo);

        expect(resultado).not.toHaveProperty('vehiculo_asignado_id');
        expect(resultado).not.toHaveProperty('vencimiento_licencia');

    });

    it('debe conservar la información en una conversión completa', () => {

        const modelo = conductorDesdeDto(conductorDto);
        const resultado = conductorADto(modelo);

        expect(resultado).toEqual(conductorDto);

    });

});
