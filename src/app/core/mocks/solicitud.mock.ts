
import { HttpErrorResponse } from '@angular/common/http';

import type {
    CrearSolicitudDto,
    SolicitudCreadaDto
} from '../dto/solicitud.dto';

import type {
    ActualizarSolicitudDto,
    CambiarEstadoSolicitudDto,
    ListadoSolicitudesDto,
    SolicitudResumenDto
} from '../dto/solicitud-listado.dto';

import type { FiltrosSolicitudes } from '../models/solicitud-resumen';

/** Factor para pasar de línea recta a distancia por carretera (provisional). */
const FACTOR_CARRETERA = 1.3;

/** Velocidad media supuesta para estimar la duración (km/h, provisional). */
const VELOCIDAD_MEDIA_KMH = 55;

function aRadianes(grados: number): number {
    return (grados * Math.PI) / 180;
}

/** Distancia en línea recta entre dos puntos (fórmula de haversine). */
export function distanciaRectaKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {

    const radioTierraKm = 6371;

    const dLat = aRadianes(lat2 - lat1);
    const dLng = aRadianes(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(aRadianes(lat1)) *
        Math.cos(aRadianes(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return 2 * radioTierraKm * Math.asin(Math.sqrt(a));
}

/**
 * Simula la respuesta del backend al registrar una solicitud (VT-010).
 *
 * Solo se usa mientras la API de Go no esté configurada.
 * Las estimaciones son aproximadas y NO reemplazan las de OSRM:
 * si faltan coordenadas no se estiman, igual que el contrato real
 * (km_estimados y duracion_estimada_min son opcionales).
 */
export function crearSolicitudSimulada(
    dto: CrearSolicitudDto,
    consecutivo: number
): SolicitudCreadaDto {

    const respuesta: SolicitudCreadaDto = {
        id: globalThis.crypto.randomUUID(),
        codigo: `SOL-2026-${String(consecutivo).padStart(3, '0')}`,
        estado: 'pendiente'
    };

    const { origen, destino } = dto;

    if (
        origen.lat !== undefined && origen.lng !== undefined &&
        destino.lat !== undefined && destino.lng !== undefined
    ) {
        const km = Math.round(
            distanciaRectaKm(
                origen.lat, origen.lng,
                destino.lat, destino.lng
            ) * FACTOR_CARRETERA * 10
        ) / 10;

        respuesta.km_estimados = km;
        respuesta.duracion_estimada_min =
            Math.round((km / VELOCIDAD_MEDIA_KMH) * 60);
    }

    return respuesta;
}

// ---------------------------------------------------------------------
// Repositorio simulado (VT-010 y VT-011)
// ---------------------------------------------------------------------

const ZONA_HORARIA = 'America/Bogota';

/** Fecha AAAA-MM-DD de un instante, en hora de Colombia. */
function diaEnColombia(iso: string): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(iso));
}

function error(status: number, mensaje: string): HttpErrorResponse {
    return new HttpErrorResponse({
        status,
        statusText: mensaje,
        error: { mensaje }
    });
}

/** Solicitudes de ejemplo del caso académico (Operadora Caribe Turístico). */
function solicitudesDeEjemplo(): SolicitudResumenDto[] {
    return [
        {
            id: '00000000-0000-4000-8000-000000000014',
            codigo: 'SOL-2026-014',
            nombre_cliente: 'Clínica Portoazul',
            origen: { direccion: 'Barranquilla', lat: 11.01, lng: -74.82 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fecha_servicio: '2026-11-25T12:00:00Z',
            pasajeros: 12,
            tarifa_pactada: 650000,
            km_estimados: 122.5,
            duracion_estimada_min: 110,
            estado: 'pendiente'
        },
        {
            id: '00000000-0000-4000-8000-000000000013',
            codigo: 'SOL-2026-013',
            nombre_cliente: 'Hotel El Prado',
            origen: { direccion: 'Hotel El Prado, Barranquilla', lat: 11.0027, lng: -74.8044 },
            destino: { direccion: 'Aeropuerto Ernesto Cortissoz', lat: 10.8896, lng: -74.7808 },
            fecha_servicio: '2026-11-25T13:00:00Z',
            pasajeros: 10,
            tarifa_pactada: 180000,
            km_estimados: 18,
            duracion_estimada_min: 35,
            estado: 'asignada',
            recorrido_codigo: 'R-7826'
        },
        {
            id: '00000000-0000-4000-8000-000000000012',
            codigo: 'SOL-2026-012',
            nombre_cliente: 'Agencia Viajes del Mar',
            origen: { direccion: 'Barranquilla centro', lat: 10.9639, lng: -74.7964 },
            destino: { direccion: 'Santa Marta', lat: 11.2408, lng: -74.199 },
            fecha_servicio: '2026-11-26T11:30:00Z',
            pasajeros: 18,
            tarifa_pactada: 950000,
            km_estimados: 100,
            duracion_estimada_min: 130,
            estado: 'pendiente'
        },
        {
            id: '00000000-0000-4000-8000-000000000011',
            codigo: 'SOL-2026-011',
            nombre_cliente: 'Hotel Puerto Real',
            origen: { direccion: 'Puerto Colombia', lat: 10.9878, lng: -74.9547 },
            destino: { direccion: 'Aeropuerto Ernesto Cortissoz', lat: 10.8896, lng: -74.7808 },
            fecha_servicio: '2026-11-19T14:00:00Z',
            pasajeros: 3,
            tarifa_pactada: 110000,
            km_estimados: 25,
            duracion_estimada_min: 40,
            estado: 'finalizada',
            recorrido_codigo: 'R-7825'
        },
        {
            id: '00000000-0000-4000-8000-000000000010',
            codigo: 'SOL-2026-010',
            nombre_cliente: 'Colegio San Ignacio',
            origen: { direccion: 'Soledad', lat: 10.9184, lng: -74.7646 },
            destino: { direccion: 'Playa Mendoza, Tubará', lat: 10.87, lng: -74.9 },
            fecha_servicio: '2026-11-27T12:30:00Z',
            pasajeros: 25,
            tarifa_pactada: 700000,
            km_estimados: 45,
            duracion_estimada_min: 70,
            estado: 'pendiente'
        },
        {
            id: '00000000-0000-4000-8000-000000000009',
            codigo: 'SOL-2026-009',
            nombre_cliente: 'Familia Rodríguez',
            origen: { direccion: 'Hotel Dann Carlton, Barranquilla', lat: 10.9965, lng: -74.8 },
            destino: { direccion: 'Aeropuerto Ernesto Cortissoz', lat: 10.8896, lng: -74.7808 },
            fecha_servicio: '2026-11-27T19:00:00Z',
            pasajeros: 5,
            tarifa_pactada: 130000,
            km_estimados: 18,
            duracion_estimada_min: 35,
            estado: 'cancelada',
            motivo_cancelacion: 'Cambio de vuelo del cliente'
        },
        {
            id: '00000000-0000-4000-8000-000000000008',
            codigo: 'SOL-2026-008',
            nombre_cliente: 'Empresa Costa Verde S.A.S.',
            origen: { direccion: 'Soledad', lat: 10.9184, lng: -74.7646 },
            destino: { direccion: 'Barranquilla centro', lat: 10.9639, lng: -74.7964 },
            fecha_servicio: '2026-11-24T11:00:00Z',
            pasajeros: 7,
            tarifa_pactada: 90000,
            km_estimados: 15,
            duracion_estimada_min: 30,
            estado: 'pendiente'
        },
        {
            id: '00000000-0000-4000-8000-000000000007',
            codigo: 'SOL-2026-007',
            nombre_cliente: 'Hotel Almirante',
            origen: { direccion: 'Barranquilla', lat: 11.0, lng: -74.8 },
            destino: { direccion: 'Cartagena', lat: 10.42, lng: -75.55 },
            fecha_servicio: '2026-11-28T13:00:00Z',
            pasajeros: 4,
            tarifa_pactada: 480000,
            km_estimados: 120,
            duracion_estimada_min: 105,
            estado: 'asignada',
            recorrido_codigo: 'R-7827'
        },
        {
            id: '00000000-0000-4000-8000-000000000006',
            codigo: 'SOL-2026-006',
            nombre_cliente: 'Tour Caribe Aventura',
            origen: { direccion: 'Barranquilla', lat: 11.0027, lng: -74.8044 },
            destino: { direccion: 'Recorrido turístico por la ciudad', lat: 11.0027, lng: -74.8044 },
            fecha_servicio: '2026-11-28T15:00:00Z',
            pasajeros: 14,
            tarifa_pactada: 420000,
            km_estimados: 40,
            duracion_estimada_min: 180,
            estado: 'pendiente'
        }
    ];
}

/**
 * Almacén en memoria que imita el comportamiento del backend para
 * registrar, listar, editar y cambiar el estado de solicitudes.
 *
 * Solo se usa mientras la API de Go no esté configurada. Los datos
 * se pierden al recargar la página.
 */
export class RepositorioSolicitudesSimulado {

    private consecutivo = 14;
    private solicitudes: SolicitudResumenDto[] = solicitudesDeEjemplo();

    /** Se invoca al cancelar una solicitud, para liberar su asignación. */
    alCancelar: ((id: string) => void) | null = null;

    /** Consulta una solicitud por su identificador. */
    obtener(id: string): SolicitudResumenDto {
        return structuredClone(this.buscar(id));
    }

    /** Lo usa el repositorio de asignaciones al confirmar. */
    marcarAsignada(id: string): void {
        this.buscar(id).estado = 'asignada';
    }

    /** VT-010 */
    crear(dto: CrearSolicitudDto): SolicitudCreadaDto {

        this.consecutivo += 1;

        const respuesta = crearSolicitudSimulada(dto, this.consecutivo);

        const nueva: SolicitudResumenDto = {
            id: respuesta.id,
            codigo: respuesta.codigo,
            nombre_cliente: dto.nombre_cliente,
            origen: { ...dto.origen },
            destino: { ...dto.destino },
            fecha_servicio: dto.fecha_servicio,
            pasajeros: dto.pasajeros,
            tarifa_pactada: dto.tarifa_pactada,
            estado: 'pendiente'
        };

        if (respuesta.km_estimados !== undefined) {
            nueva.km_estimados = respuesta.km_estimados;
        }
        if (respuesta.duracion_estimada_min !== undefined) {
            nueva.duracion_estimada_min = respuesta.duracion_estimada_min;
        }

        this.solicitudes.push(nueva);

        return respuesta;
    }

    /** VT-011. Filtra por estado y por día del servicio (hora de Colombia). */
    listar(filtros: FiltrosSolicitudes): ListadoSolicitudesDto {

        const elementos = this.solicitudes
            .filter(s => filtros.estado === undefined || s.estado === filtros.estado)
            .filter(s =>
                filtros.fecha === undefined ||
                (s.fecha_servicio !== undefined &&
                    diaEnColombia(s.fecha_servicio) === filtros.fecha))
            .sort((a, b) =>
                (a.fecha_servicio ?? '').localeCompare(b.fecha_servicio ?? ''))
            .map(s => structuredClone(s));

        return { elementos, total: elementos.length };
    }

    /** VT-011. Solo se puede cancelar una solicitud pendiente o asignada. */
    cambiarEstado(id: string, cambio: CambiarEstadoSolicitudDto): void {

        const solicitud = this.buscar(id);

        if (cambio.estado !== 'cancelada') {
            throw error(409, 'Esta operación solo permite cancelar la solicitud');
        }

        if (solicitud.estado !== 'pendiente' && solicitud.estado !== 'asignada') {
            throw error(409, `La solicitud está ${solicitud.estado} y no se puede cancelar`);
        }

        const motivo = (cambio.motivo_cancelacion ?? '').trim();

        if (motivo === '') {
            throw error(422, 'El motivo de cancelación es obligatorio');
        }

        solicitud.estado = 'cancelada';
        solicitud.motivo_cancelacion = motivo;

        this.alCancelar?.(id);
    }

    /**
     * VT-011 (endpoint PROPUESTO). La ruta, la fecha y los pasajeros solo
     * se editan con la solicitud pendiente; el cliente y la tarifa, hasta
     * que termine o se cancele.
     */
    actualizar(id: string, cambios: ActualizarSolicitudDto): void {

        const solicitud = this.buscar(id);

        if (solicitud.estado === 'finalizada' || solicitud.estado === 'cancelada') {
            throw error(409, `La solicitud está ${solicitud.estado} y no se puede editar`);
        }

        const tocaRuta =
            cambios.origen !== undefined ||
            cambios.destino !== undefined ||
            cambios.fecha_servicio !== undefined ||
            cambios.pasajeros !== undefined;

        if (tocaRuta && solicitud.estado !== 'pendiente') {
            throw error(409, 'La ruta, la fecha y los pasajeros no se pueden editar con una asignación vigente');
        }

        if (cambios.nombre_cliente !== undefined) {
            solicitud.nombre_cliente = cambios.nombre_cliente;
        }
        if (cambios.tarifa_pactada !== undefined) {
            solicitud.tarifa_pactada = cambios.tarifa_pactada;
        }
        if (cambios.origen !== undefined) {
            solicitud.origen = { ...cambios.origen };
        }
        if (cambios.destino !== undefined) {
            solicitud.destino = { ...cambios.destino };
        }
        if (cambios.fecha_servicio !== undefined) {
            solicitud.fecha_servicio = cambios.fecha_servicio;
        }
        if (cambios.pasajeros !== undefined) {
            solicitud.pasajeros = cambios.pasajeros;
        }
    }

    private buscar(id: string): SolicitudResumenDto {

        const solicitud = this.solicitudes.find(s => s.id === id);

        if (solicitud === undefined) {
            throw error(404, 'Solicitud no encontrada');
        }

        return solicitud;
    }
}
