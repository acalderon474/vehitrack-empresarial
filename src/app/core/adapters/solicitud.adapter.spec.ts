
import type { NuevaSolicitud } from '../models/solicitud';

import { solicitudACrearDto } from './solicitud.adapter';

describe('Adaptador de Solicitudes', () => {

    const solicitudBase: NuevaSolicitud = {
        nombreCliente: 'Hotel Caribe',

        origen: {
            direccion: 'Barranquilla, Atlántico',
            lat: 11.01,
            lng: -74.82
        },

        destino: {
            direccion: 'Cartagena, Bolívar',
            lat: 10.42,
            lng: -75.54
        },

        fechaHora: '2026-11-29T12:00:00Z',
        cantidadPasajeros: 12,
        tarifa: 650000
    };

    it('debe convertir la solicitud al JSON de Go', () => {

        const resultado = solicitudACrearDto(solicitudBase);

        expect(resultado).toEqual({
            nombre_cliente: 'Hotel Caribe',

            origen: {
                direccion: 'Barranquilla, Atlántico',
                lat: 11.01,
                lng: -74.82
            },

            destino: {
                direccion: 'Cartagena, Bolívar',
                lat: 10.42,
                lng: -75.54
            },

            fecha_servicio: '2026-11-29T12:00:00Z',
            pasajeros: 12,
            tarifa_pactada: 650000
        });

    });

    it('debe conservar coordenadas geograficas iguales a cero', () => {

        const solicitud: NuevaSolicitud = {
            ...solicitudBase,

            origen: {
                direccion: 'Punto de origen',
                lat: 0,
                lng: 0
            }
        };

        const resultado = solicitudACrearDto(solicitud);

        expect(resultado.origen.lat).toBe(0);
        expect(resultado.origen.lng).toBe(0);

    });

    it('debe permitir ubicaciones sin coordenadas', () => {

        const solicitud: NuevaSolicitud = {
            ...solicitudBase,

            origen: {
                direccion: 'Hotel pendiente de geocodificacion'
            },

            destino: {
                direccion: 'Aeropuerto'
            }
        };

        const resultado = solicitudACrearDto(solicitud);

        expect(resultado.origen).toEqual({
            direccion: 'Hotel pendiente de geocodificacion'
        });

        expect(resultado.destino).toEqual({
            direccion: 'Aeropuerto'
        });

    });

    it('debe conservar los valores numericos sin modificarlos', () => {

        const resultado = solicitudACrearDto(solicitudBase);

        expect(resultado.pasajeros).toBe(12);
        expect(resultado.tarifa_pactada).toBe(650000);

    });

    it('no debe modificar los datos originales de Angular', () => {

        const resultado = solicitudACrearDto(solicitudBase);

        expect(resultado.origen).not.toBe(solicitudBase.origen);
        expect(resultado.destino).not.toBe(solicitudBase.destino);

        resultado.origen.direccion = 'Direccion modificada';

        expect(solicitudBase.origen.direccion)
            .toBe('Barranquilla, Atlántico');

    });

});
