
import type {
    DatosCierreRecorrido
} from '../models/recorrido';

import {
    cierreRecorridoADto,
    recorridoSeguimientoDesdeDto
} from './recorrido.adapter';

import type {
    RecorridoSeguimientoDto
} from '../dto/recorrido.dto';

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

    describe('Seguimiento de recorridos', () => {

        const base: RecorridoSeguimientoDto = {
            id: 'rec-1',
            codigo: 'R-7826',
            asignacion_id: 'asg-1',
            solicitud_codigo: 'S-4588',
            origen: 'Hotel El Prado',
            destino: 'Centro de eventos',
            placa: 'TRB-417',
            conductor: 'C-002',
            estado: 'en_curso',
            fecha_inicio: '2026-11-20T14:30:00Z',
            tarifa_pactada: 95000,
            costo_estimado: 41000,
            margen_estimado: 54000
        };

        it('debe convertir un recorrido en curso sin campos opcionales', () => {

            expect(recorridoSeguimientoDesdeDto(base)).toEqual({
                id: 'rec-1',
                codigo: 'R-7826',
                asignacionId: 'asg-1',
                solicitudCodigo: 'S-4588',
                origen: 'Hotel El Prado',
                destino: 'Centro de eventos',
                placa: 'TRB-417',
                conductor: 'C-002',
                estado: 'en_curso',
                fechaInicio: '2026-11-20T14:30:00Z',
                tarifa: 95000,
                costoEstimado: 41000,
                margenEstimado: 54000
            });

        });

        it('debe convertir los gastos de un recorrido cerrado', () => {

            const resultado = recorridoSeguimientoDesdeDto({
                ...base,
                estado: 'finalizado',
                fecha_fin: '2026-11-20T18:00:00Z',
                km_reales: 25.2,
                costo_real: 56000,
                desviacion_costos: 5000,
                margen_real: 64000,
                gastos: {
                    costo_combustible: 24000,
                    costo_peajes: 8000,
                    costo_mantenimiento: 5000,
                    costo_conductor: 18000,
                    otros_gastos: 1000
                }
            });

            expect(resultado.fechaFin).toBe('2026-11-20T18:00:00Z');
            expect(resultado.kilometrosReales).toBe(25.2);
            expect(resultado.costoReal).toBe(56000);
            expect(resultado.desviacionCostos).toBe(5000);
            expect(resultado.margenReal).toBe(64000);
            expect(resultado.gastos).toEqual({
                combustible: 24000,
                peajes: 8000,
                mantenimiento: 5000,
                conductor: 18000,
                otros: 1000
            });

        });

    });

});
