
import type { Asignacion } from '../models/asignacion';
import type { AsignacionDto } from '../dto/asignacion.dto';

import {
    asignacionDesdeDto,
    asignacionADto
} from './asignacion.adapter';

describe('Adaptador de Asignaciones', () => {

    const asignacionDto: AsignacionDto = {
        id: 'A001',
        solicitud_id: 'S001',
        vehiculo_id: 'V001',
        conductor_id: 'C001',

        km_vacios: 7,
        costo_estimado: 278032,
        margen_proyectado: 371968,

        explicacion_criterios:
            'Mayor margen entre alternativas elegibles',

        estado: 'propuesta'
    };

    it('debe convertir el DTO de Go al modelo Angular', () => {

        const resultado = asignacionDesdeDto(asignacionDto);

        expect(resultado).toEqual({
            id: 'A001',
            solicitudId: 'S001',
            vehiculoId: 'V001',
            conductorId: 'C001',

            kilometrosVaciosEstimados: 7,
            costoEstimado: 278032,
            margenEstimado: 371968,

            justificacion:
                'Mayor margen entre alternativas elegibles',

            estado: 'propuesta'
        });

    });

    it('debe convertir el modelo Angular al DTO', () => {

        const asignacion: Asignacion = {
            id: 'A002',
            solicitudId: 'S002',
            vehiculoId: 'V002',
            conductorId: 'C002',

            kilometrosVaciosEstimados: 3,
            costoEstimado: 345671,
            margenEstimado: 304329,

            justificacion:
                'Segunda alternativa económicamente elegible',

            estado: 'confirmada'
        };

        const resultado = asignacionADto(asignacion);

        expect(resultado).toEqual({
            id: 'A002',
            solicitud_id: 'S002',
            vehiculo_id: 'V002',
            conductor_id: 'C002',

            km_vacios: 3,
            costo_estimado: 345671,
            margen_proyectado: 304329,

            explicacion_criterios:
                'Segunda alternativa económicamente elegible',

            estado: 'confirmada'
        });

    });

    it('debe conservar los estados de asignación', () => {

        const estados: Asignacion['estado'][] = [
            'propuesta',
            'confirmada',
            'cancelada'
        ];

        for (const estado of estados) {

            const dto: AsignacionDto = {
                ...asignacionDto,
                estado
            };

            const modelo = asignacionDesdeDto(dto);

            expect(modelo.estado).toBe(estado);
            expect(asignacionADto(modelo).estado).toBe(estado);
        }

    });

    it('debe conservar valores económicos iguales a cero', () => {

        const dto: AsignacionDto = {
            ...asignacionDto,

            km_vacios: 0,
            costo_estimado: 0,
            margen_proyectado: 0
        };

        const modelo = asignacionDesdeDto(dto);

        expect(modelo.kilometrosVaciosEstimados).toBe(0);
        expect(modelo.costoEstimado).toBe(0);
        expect(modelo.margenEstimado).toBe(0);

        expect(asignacionADto(modelo)).toEqual(dto);

    });

    it('debe conservar los datos en una conversión completa', () => {

        const modelo = asignacionDesdeDto(asignacionDto);

        const resultado = asignacionADto(modelo);

        expect(resultado).toEqual(asignacionDto);

    });

});
