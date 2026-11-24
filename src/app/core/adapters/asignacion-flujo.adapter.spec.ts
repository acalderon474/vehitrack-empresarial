
import type {
    AlternativaDetalladaDto,
    HistorialAsignacionDto
} from '../dto/asignacion-flujo.dto';

import {
    alternativaDesdeDto,
    conductoresDesdeDto,
    confirmacionDesdeDto,
    confirmarADto,
    historialDesdeDto,
    recomendacionesDesdeDto
} from './asignacion-flujo.adapter';

describe('Adaptador del flujo de asignación', () => {

    const alternativa: AlternativaDetalladaDto = {
        vehiculo_id: 'veh-1',
        placa: 'KLA-452',
        km_vacios: 7,
        km_totales_estimados: 129.5,
        costo_estimado: 278032,
        margen_proyectado: 371968,
        porcentaje_margen: 57.23,
        recomendado: true,
        explicacion_criterios: 'Mayor margen entre alternativas elegibles'
    };

    it('debe convertir una alternativa del contrato base', () => {

        expect(alternativaDesdeDto(alternativa)).toEqual({
            vehiculoId: 'veh-1',
            placa: 'KLA-452',
            kmVacios: 7,
            kmTotalesEstimados: 129.5,
            costoEstimado: 278032,
            margenProyectado: 371968,
            porcentajeMargen: 57.23,
            recomendado: true,
            explicacionCriterios: 'Mayor margen entre alternativas elegibles'
        });
    });

    it('no debe inventar los puestos ni el código si el backend no los envía', () => {

        const resultado = alternativaDesdeDto(alternativa);

        expect('capacidadPasajeros' in resultado).toBe(false);
        expect('codigoVehiculo' in resultado).toBe(false);
    });

    it('debe conservar los puestos y el código cuando existen', () => {

        const resultado = alternativaDesdeDto({
            ...alternativa,
            capacidad_pasajeros: 15,
            codigo: 'V-101'
        });

        expect(resultado.capacidadPasajeros).toBe(15);
        expect(resultado.codigoVehiculo).toBe('V-101');
    });

    it('debe convertir las recomendaciones completas', () => {

        const resultado = recomendacionesDesdeDto({
            solicitud_id: 'sol-1',
            tarifa_pactada: 650000,
            alternativas: [alternativa, { ...alternativa, vehiculo_id: 'veh-2', recomendado: false }]
        });

        expect(resultado.solicitudId).toBe('sol-1');
        expect(resultado.tarifaPactada).toBe(650000);
        expect(resultado.alternativas).toHaveLength(2);
        expect(resultado.alternativas[1]?.recomendado).toBe(false);
    });

    it('debe aceptar una lista de alternativas vacía', () => {

        const resultado = recomendacionesDesdeDto({
            solicitud_id: 'sol-1',
            tarifa_pactada: 100000,
            alternativas: []
        });

        expect(resultado.alternativas).toEqual([]);
    });

    it('debe convertir los conductores y conservar su código', () => {

        const resultado = conductoresDesdeDto({
            total: 2,
            elementos: [
                {
                    id: 'c1', codigo: 'C-001', nombre_completo: 'Carlos Pérez',
                    categoria_licencia: 'C2', estado: 'disponible',
                    vencimiento_licencia: '2028-05-10'
                },
                {
                    id: 'c2', nombre_completo: 'Luis Herrera',
                    categoria_licencia: 'C2', estado: 'disponible'
                }
            ]
        });

        expect(resultado[0]).toEqual({
            id: 'c1', codigo: 'C-001', nombreCompleto: 'Carlos Pérez',
            categoriaLicencia: 'C2', estado: 'disponible',
            vencimientoLicencia: '2028-05-10'
        });
        expect('codigo' in (resultado[1] ?? {})).toBe(false);
        expect('vencimientoLicencia' in (resultado[1] ?? {})).toBe(false);
    });

    it('debe armar el cuerpo de la confirmación con el contrato de la matriz', () => {

        expect(confirmarADto({
            solicitudId: 'sol-1',
            vehiculoId: 'veh-1',
            conductorId: 'con-1',
            motivoSeleccion: 'Mayor margen estimado entre opciones elegibles'
        })).toEqual({
            solicitud_id: 'sol-1',
            vehiculo_id: 'veh-1',
            conductor_id: 'con-1',
            motivo_seleccion: 'Mayor margen estimado entre opciones elegibles'
        });
    });

    it('debe convertir la respuesta de la confirmación', () => {

        expect(confirmacionDesdeDto({
            asignacion_id: 'asg-1',
            estado: 'confirmada',
            costo_estimado: 278032,
            estado_vehiculo: 'en_servicio',
            estado_conductor: 'asignado'
        })).toEqual({
            asignacionId: 'asg-1',
            estado: 'confirmada',
            costoEstimado: 278032,
            estadoVehiculo: 'en_servicio',
            estadoConductor: 'asignado'
        });
    });

    describe('historial', () => {

        const base: HistorialAsignacionDto = {
            asignacion_id: 'asg-1',
            solicitud_id: 'sol-1',
            vehiculo_elegido_id: 'veh-1',
            conductor_id: 'con-1',
            conductor_nombre: 'Carlos Pérez',
            motivo_seleccion: 'Recomendación óptima del sistema',
            recomendada: true,
            costo_estimado: 51000,
            margen_proyectado: 69000,
            estado_servicio: 'finalizado',
            alternativas: [alternativa]
        };

        it('debe convertir los datos obligatorios', () => {

            const h = historialDesdeDto(base);

            expect(h.asignacionId).toBe('asg-1');
            expect(h.vehiculoElegidoId).toBe('veh-1');
            expect(h.conductorNombre).toBe('Carlos Pérez');
            expect(h.esRecomendada).toBe(true);
            expect(h.margenPrevisto).toBe(69000);
            expect(h.alternativas).toHaveLength(1);
        });

        it('no debe inventar el margen registrado, el recorrido ni el código', () => {

            const h = historialDesdeDto(base);

            expect('margenRegistrado' in h).toBe(false);
            expect('codigoRecorrido' in h).toBe(false);
            expect('conductorCodigo' in h).toBe(false);
        });

        it('debe conservar los datos opcionales, incluido un margen registrado negativo o cero', () => {

            const h = historialDesdeDto({
                ...base,
                margen_registrado: 0,
                recorrido_codigo: 'R-7825',
                conductor_codigo: 'C-003'
            });

            expect(h.margenRegistrado).toBe(0);
            expect(h.codigoRecorrido).toBe('R-7825');
            expect(h.conductorCodigo).toBe('C-003');
        });
    });
});
