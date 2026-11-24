
import type { NuevaSolicitud } from '../models/solicitud';
import type { SolicitudCreadaDto } from '../dto/solicitud.dto';

import { solicitudDesdeCreadaDto } from './solicitud-creada.adapter';

describe('Adaptador de solicitud creada', () => {

    const datos: NuevaSolicitud = {
        nombreCliente: 'Clínica Portoazul',
        origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
        destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
        fechaHora: '2026-11-29T12:00:00.000Z',
        cantidadPasajeros: 12,
        tarifa: 650000
    };

    const respuesta: SolicitudCreadaDto = {
        id: 'uuid-1',
        codigo: 'SOL-2026-014',
        km_estimados: 122.5,
        duracion_estimada_min: 110,
        estado: 'pendiente'
    };

    it('debe combinar lo enviado con la respuesta del backend', () => {

        const solicitud = solicitudDesdeCreadaDto(respuesta, datos);

        expect(solicitud).toEqual({
            id: 'uuid-1',
            codigo: 'SOL-2026-014',
            nombreCliente: 'Clínica Portoazul',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fechaHora: '2026-11-29T12:00:00.000Z',
            cantidadPasajeros: 12,
            tarifa: 650000,
            estado: 'pendiente',
            kmEstimados: 122.5,
            duracionEstimadaMin: 110
        });
    });

    it('no debe inventar estimaciones si el backend no las envía', () => {

        const sinEstimaciones: SolicitudCreadaDto = {
            id: 'uuid-2',
            codigo: 'SOL-2026-015',
            estado: 'pendiente'
        };

        const solicitud = solicitudDesdeCreadaDto(sinEstimaciones, datos);

        expect('kmEstimados' in solicitud).toBe(false);
        expect('duracionEstimadaMin' in solicitud).toBe(false);
    });

    it('debe conservar estimaciones iguales a cero', () => {

        const solicitud = solicitudDesdeCreadaDto(
            { ...respuesta, km_estimados: 0, duracion_estimada_min: 0 },
            datos
        );

        expect(solicitud.kmEstimados).toBe(0);
        expect(solicitud.duracionEstimadaMin).toBe(0);
    });

    it('no debe compartir las ubicaciones con los datos originales', () => {

        const solicitud = solicitudDesdeCreadaDto(respuesta, datos);

        expect(solicitud.origen).not.toBe(datos.origen);
        expect(solicitud.destino).not.toBe(datos.destino);
    });
});
