
import type { SolicitudResumenDto } from '../dto/solicitud-listado.dto';

import {
    cambiosADto,
    filtrosAConsulta,
    listadoSolicitudesDesdeDto,
    solicitudResumenDesdeDto
} from './solicitud-listado.adapter';

describe('Adaptador del listado de solicitudes', () => {

    const minimo: SolicitudResumenDto = {
        id: 'uuid-1',
        codigo: 'SOL-2026-014',
        pasajeros: 12,
        tarifa_pactada: 650000,
        estado: 'pendiente'
    };

    it('debe convertir el ejemplo mínimo de la matriz', () => {

        expect(solicitudResumenDesdeDto(minimo)).toEqual({
            id: 'uuid-1',
            codigo: 'SOL-2026-014',
            cantidadPasajeros: 12,
            tarifa: 650000,
            estado: 'pendiente'
        });
    });

    it('no debe inventar campos que el backend no envía', () => {

        const resultado = solicitudResumenDesdeDto(minimo);

        expect('nombreCliente' in resultado).toBe(false);
        expect('origen' in resultado).toBe(false);
        expect('fechaHora' in resultado).toBe(false);
        expect('codigoRecorrido' in resultado).toBe(false);
    });

    it('debe convertir un elemento completo', () => {

        const resultado = solicitudResumenDesdeDto({
            ...minimo,
            nombre_cliente: 'Clínica Portoazul',
            fecha_servicio: '2026-11-25T12:00:00Z',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena' },
            km_estimados: 122.5,
            duracion_estimada_min: 110,
            estado: 'cancelada',
            motivo_cancelacion: 'Reprogramado por cliente',
            recorrido_codigo: 'R-7825'
        });

        expect(resultado.nombreCliente).toBe('Clínica Portoazul');
        expect(resultado.fechaHora).toBe('2026-11-25T12:00:00Z');
        expect(resultado.origen).toEqual({ direccion: 'Barranquilla', lat: 11.01, lng: -74.82 });
        expect(resultado.destino).toEqual({ direccion: 'Cartagena' });
        expect(resultado.kmEstimados).toBe(122.5);
        expect(resultado.duracionEstimadaMin).toBe(110);
        expect(resultado.motivoCancelacion).toBe('Reprogramado por cliente');
        expect(resultado.codigoRecorrido).toBe('R-7825');
    });

    it('debe conservar valores iguales a cero', () => {

        const resultado = solicitudResumenDesdeDto({
            ...minimo,
            km_estimados: 0,
            duracion_estimada_min: 0
        });

        expect(resultado.kmEstimados).toBe(0);
        expect(resultado.duracionEstimadaMin).toBe(0);
    });

    it('debe convertir el listado con su total', () => {

        const resultado = listadoSolicitudesDesdeDto({
            elementos: [minimo],
            total: 10
        });

        expect(resultado.total).toBe(10);
        expect(resultado.elementos).toHaveLength(1);
        expect(resultado.elementos[0]?.codigo).toBe('SOL-2026-014');
    });

    it('debe construir la consulta de filtros', () => {

        expect(filtrosAConsulta({})).toBe('');
        expect(filtrosAConsulta({ estado: 'pendiente' })).toBe('?estado=pendiente');
        expect(filtrosAConsulta({ fecha: '2026-11-25' })).toBe('?fecha=2026-11-25');
        expect(filtrosAConsulta({ estado: 'asignada', fecha: '2026-11-25' }))
            .toBe('?estado=asignada&fecha=2026-11-25');
    });

    it('debe convertir solo los cambios enviados al editar', () => {

        expect(cambiosADto({ nombreCliente: 'Nuevo', tarifa: 700000 })).toEqual({
            nombre_cliente: 'Nuevo',
            tarifa_pactada: 700000
        });

        expect(cambiosADto({})).toEqual({});
    });

    it('debe convertir una edición completa de la ruta', () => {

        expect(cambiosADto({
            origen: { direccion: 'A', lat: 1, lng: 2 },
            destino: { direccion: 'B' },
            fechaHora: '2026-12-01T12:00:00.000Z',
            cantidadPasajeros: 5
        })).toEqual({
            origen: { direccion: 'A', lat: 1, lng: 2 },
            destino: { direccion: 'B' },
            fecha_servicio: '2026-12-01T12:00:00.000Z',
            pasajeros: 5
        });
    });
});
