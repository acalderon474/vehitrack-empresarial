
import type {
    DatosCierreRecorrido
} from '../models/recorrido';

import {
    cierreRecorridoADto
} from './recorrido.adapter';

describe('Adaptador de Recorridos', () => {

    const cierreBase: DatosCierreRecorrido = {
        kilometrosRecorridos: 129.5,

        gastos: {
            combustible: 67000,
            peajes: 42000,
            mantenimiento: 103000,
            conductor: 60000,
            otros: 15000
        },

        observaciones: 'Cierre académico del recorrido'
    };

    it('debe convertir el cierre al JSON de Go', () => {

        const resultado = cierreRecorridoADto(cierreBase);

        expect(resultado).toEqual({
            km_reales: 129.5,
            costo_combustible: 67000,
            costo_peajes: 42000,
            costo_mantenimiento: 103000,
            costo_conductor: 60000,
            otros_gastos: 15000,
            observaciones: 'Cierre académico del recorrido'
        });

    });

    it('debe conservar valores económicos iguales a cero', () => {

        const datos: DatosCierreRecorrido = {
            kilometrosRecorridos: 0,

            gastos: {
                combustible: 0,
                peajes: 0,
                mantenimiento: 0,
                conductor: 0,
                otros: 0
            }
        };

        const resultado = cierreRecorridoADto(datos);

        expect(resultado.km_reales).toBe(0);
        expect(resultado.costo_combustible).toBe(0);
        expect(resultado.costo_peajes).toBe(0);
        expect(resultado.costo_mantenimiento).toBe(0);
        expect(resultado.costo_conductor).toBe(0);
        expect(resultado.otros_gastos).toBe(0);

    });

    it('debe omitir observaciones cuando no se proporcionan', () => {

        const datos: DatosCierreRecorrido = {
            kilometrosRecorridos: 100,

            gastos: {
                combustible: 50000,
                peajes: 20000,
                mantenimiento: 10000,
                conductor: 30000,
                otros: 0
            }
        };

        const resultado = cierreRecorridoADto(datos);

        expect(resultado).not.toHaveProperty('observaciones');

    });

    it('debe conservar observaciones vacías si se proporcionan', () => {

        const datos: DatosCierreRecorrido = {
            ...cierreBase,
            observaciones: ''
        };

        const resultado = cierreRecorridoADto(datos);

        expect(resultado.observaciones).toBe('');

    });

    it('no debe agregar cálculos económicos al JSON', () => {

        const resultado = cierreRecorridoADto(cierreBase);

        expect(resultado).not.toHaveProperty('costo_real');
        expect(resultado).not.toHaveProperty('margen_real');
        expect(resultado).not.toHaveProperty('tarifa_pactada');
        expect(resultado).not.toHaveProperty('asignacion_id');

        expect(Object.keys(resultado).sort()).toEqual([
            'km_reales',
            'costo_combustible',
            'costo_peajes',
            'costo_mantenimiento',
            'costo_conductor',
            'otros_gastos',
            'observaciones'
        ].sort());

    });

});
