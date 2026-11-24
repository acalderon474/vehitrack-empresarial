
import { HttpErrorResponse } from '@angular/common/http';

import type {
    AlternativaDetalladaDto,
    ConductorDisponibleDto,
    ConfirmacionAsignacionDto,
    HistorialAsignacionDto,
    ListadoConductoresDto,
    RecomendacionesDetalladasDto
} from '../dto/asignacion-flujo.dto';

import type { ConfirmarAsignacionDto } from '../dto/asignacion.dto';
import type { SolicitudResumenDto } from '../dto/solicitud-listado.dto';

import { distanciaRectaKm, RepositorioSolicitudesSimulado } from './solicitud.mock';

/** Precio del galón y viáticos supuestos por el simulador (provisionales). */
const PRECIO_GALON = 15800;
const VIATICOS = 60000;

/** Los viáticos solo se cobran en servicios largos (intermunicipales). */
const UMBRAL_VIATICOS_KM = 80;
const FACTOR_CARRETERA = 1.3;
const HOLGURA_MIN = 30;

interface VehiculoSimulado {
    id: string;
    codigo: string;
    placa: string;
    tipo: string;
    capacidad: number;
    rendimientoKmGal: number;
    costoPorKm: number;
    costoDespacho: number;
    estado: 'disponible' | 'mantenimiento';
    baseLat: number;
    baseLng: number;
}

interface ConductorSimulado extends ConductorDisponibleDto {
    codigo: string;
}

interface AsignacionSimulada {
    id: string;
    solicitudId: string;
    vehiculoId: string;
    conductorId: string;
    motivo: string;
    costoEstimado: number;
    margenPrevisto: number;
    margenRegistrado?: number;
    estado: 'confirmada' | 'finalizada' | 'cancelada';

    /** Alternativas tal como se evaluaron en el momento de confirmar. */
    alternativas: AlternativaDetalladaDto[];
    esRecomendada: boolean;
}

/** Flota del caso académico (Operadora Caribe Turístico). */
function flotaDeEjemplo(): VehiculoSimulado[] {
    return [
        { id: 'veh-101', codigo: 'V-101', placa: 'KLA-452', tipo: 'Van', capacidad: 15, rendimientoKmGal: 32.5, costoPorKm: 850, costoDespacho: 45000, estado: 'disponible', baseLat: 10.9184, baseLng: -74.7646 },
        { id: 'veh-102', codigo: 'V-102', placa: 'KLB-118', tipo: 'Van', capacidad: 12, rendimientoKmGal: 30, costoPorKm: 780, costoDespacho: 40000, estado: 'disponible', baseLat: 10.9639, baseLng: -74.7964 },
        { id: 'veh-103', codigo: 'V-103', placa: 'TRX-907', tipo: 'Microbús', capacidad: 19, rendimientoKmGal: 24, costoPorKm: 1100, costoDespacho: 60000, estado: 'disponible', baseLat: 10.9184, baseLng: -74.7646 },
        { id: 'veh-104', codigo: 'V-104', placa: 'NPQ-331', tipo: 'Automóvil', capacidad: 4, rendimientoKmGal: 48, costoPorKm: 420, costoDespacho: 20000, estado: 'disponible', baseLat: 10.9878, baseLng: -74.9547 },
        { id: 'veh-105', codigo: 'V-105', placa: 'WSD-204', tipo: 'Camioneta', capacidad: 7, rendimientoKmGal: 36, costoPorKm: 650, costoDespacho: 30000, estado: 'disponible', baseLat: 10.9639, baseLng: -74.7964 },
        { id: 'veh-106', codigo: 'V-106', placa: 'LMV-560', tipo: 'Bus', capacidad: 30, rendimientoKmGal: 14, costoPorKm: 1700, costoDespacho: 90000, estado: 'mantenimiento', baseLat: 10.9184, baseLng: -74.7646 }
    ];
}

/** Conductores ficticios. Ricardo tiene la licencia vencida; Andrea está en descanso. */
function conductoresDeEjemplo(): ConductorSimulado[] {
    return [
        { id: 'con-001', codigo: 'C-001', nombre_completo: 'Carlos Pérez', categoria_licencia: 'C2', estado: 'disponible', vencimiento_licencia: '2028-05-10' },
        { id: 'con-002', codigo: 'C-002', nombre_completo: 'Luis Herrera', categoria_licencia: 'C2', estado: 'disponible', vencimiento_licencia: '2029-02-18' },
        { id: 'con-003', codigo: 'C-003', nombre_completo: 'Marta Ospina', categoria_licencia: 'C2', estado: 'disponible', vencimiento_licencia: '2027-11-30' },
        { id: 'con-004', codigo: 'C-004', nombre_completo: 'Jorge Castañeda', categoria_licencia: 'C1', estado: 'disponible', vencimiento_licencia: '2028-09-01' },
        { id: 'con-005', codigo: 'C-005', nombre_completo: 'Andrea Villalba', categoria_licencia: 'C2', estado: 'descanso', vencimiento_licencia: '2029-07-22' },
        { id: 'con-006', codigo: 'C-006', nombre_completo: 'Ricardo Mejía', categoria_licencia: 'C2', estado: 'disponible', vencimiento_licencia: '2026-06-30' }
    ];
}

function error(status: number, mensaje: string): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: mensaje, error: { mensaje } });
}

function coma(valor: number): string {
    return String(valor).replace('.', ',');
}

function pesos(valor: number): string {
    return '$' + String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Ventana de tiempo que ocupa un servicio, en milisegundos. */
function ventana(s: SolicitudResumenDto): [number, number] {
    const inicio = new Date(s.fecha_servicio ?? 0).getTime();
    const fin = inicio + ((s.duracion_estimada_min ?? 0) + HOLGURA_MIN) * 60000;
    return [inicio, fin];
}

function secruzan(a: SolicitudResumenDto, b: SolicitudResumenDto): boolean {
    const [ai, af] = ventana(a);
    const [bi, bf] = ventana(b);
    return ai < bf && bi < af;
}

/**
 * Repositorio simulado de asignaciones (VT-012 y VT-013).
 *
 * Aplica el modelo económico de la matriz:
 *   km totales = km del servicio + km vacíos
 *   costo = combustible + desgaste + fijo (despacho, y viáticos solo
 *           en servicios de más de 80 km)
 *   margen = tarifa pactada - costo
 * y ordena las alternativas por mayor margen.
 *
 * Solo se usa mientras la API de Go no esté configurada.
 */
export class RepositorioAsignacionesSimulado {

    private readonly flota = flotaDeEjemplo();
    private readonly conductores = conductoresDeEjemplo();
    private asignaciones: AsignacionSimulada[] = [];
    private consecutivo = 100;

    constructor(private readonly solicitudes: RepositorioSolicitudesSimulado) {

        this.solicitudes.alCancelar = id => this.cancelarPorSolicitud(id);

        // Asignaciones que ya existen para las solicitudes de ejemplo.
        this.sembrar('00000000-0000-4000-8000-000000000013', 'veh-102', 'con-002', 'confirmada');
        this.sembrar('00000000-0000-4000-8000-000000000007', 'veh-104', 'con-003', 'confirmada');
        this.sembrar('00000000-0000-4000-8000-000000000011', 'veh-104', 'con-004', 'finalizada', 5000);
    }

    /** VT-012. Evalúa los vehículos elegibles para una solicitud pendiente. */
    recomendar(solicitudId: string): RecomendacionesDetalladasDto {

        const solicitud = this.solicitudes.obtener(solicitudId);

        if (solicitud.estado !== 'pendiente') {
            throw error(409, `La solicitud está ${solicitud.estado} y no admite recomendación`);
        }

        return {
            solicitud_id: solicitud.id,
            tarifa_pactada: solicitud.tarifa_pactada,
            alternativas: this.evaluar(solicitud, true)
        };
    }

    /** Conductores con estado disponible (como el filtro ?estado=disponible). */
    conductoresDisponibles(): ListadoConductoresDto {

        const elementos = this.conductores
            .filter(c => c.estado === 'disponible')
            .map(c => ({ ...c }));

        return { elementos, total: elementos.length };
    }

    /** VT-013. Confirma la asignación validando de nuevo en el "servidor". */
    confirmar(datos: ConfirmarAsignacionDto): ConfirmacionAsignacionDto {

        const solicitud = this.solicitudes.obtener(datos.solicitud_id);

        if (solicitud.estado !== 'pendiente') {
            throw error(409, `La solicitud está ${solicitud.estado} y no se puede asignar`);
        }

        const vehiculo = this.flota.find(v => v.id === datos.vehiculo_id);
        const conductor = this.conductores.find(c => c.id === datos.conductor_id);

        if (vehiculo === undefined) {
            throw error(404, 'Vehículo no encontrado');
        }
        if (conductor === undefined) {
            throw error(404, 'Conductor no encontrado');
        }
        if (vehiculo.capacidad < solicitud.pasajeros) {
            throw error(422, 'El vehículo no tiene capacidad suficiente');
        }
        if (vehiculo.estado !== 'disponible') {
            throw error(409, 'El vehículo no está disponible');
        }
        if (conductor.estado !== 'disponible') {
            throw error(409, 'El conductor no está disponible');
        }
        if (
            conductor.vencimiento_licencia !== undefined &&
            new Date(conductor.vencimiento_licencia).getTime() <
            new Date(solicitud.fecha_servicio ?? 0).getTime()
        ) {
            throw error(409, 'La licencia del conductor está vencida');
        }
        if (this.ocupado(vehiculo.id, solicitud, 'vehiculo') || this.ocupado(conductor.id, solicitud, 'conductor')) {
            throw error(409, 'El vehículo o el conductor ya tienen un servicio que se cruza con este horario');
        }

        const alternativas = this.evaluar(solicitud, true);
        const elegida = alternativas.find(a => a.vehiculo_id === vehiculo.id);

        if (elegida === undefined) {
            throw error(409, 'El vehículo no es elegible para esta solicitud');
        }

        const motivo = datos.motivo_seleccion.trim();

        if (!elegida.recomendado && motivo === '') {
            throw error(422, 'El motivo es obligatorio al elegir una alternativa distinta de la recomendada');
        }

        this.consecutivo += 1;

        const asignacion: AsignacionSimulada = {
            id: `asg-${this.consecutivo}`,
            solicitudId: solicitud.id,
            vehiculoId: vehiculo.id,
            conductorId: conductor.id,
            motivo: motivo === '' ? 'Recomendación óptima del sistema' : motivo,
            costoEstimado: elegida.costo_estimado,
            margenPrevisto: elegida.margen_proyectado,
            estado: 'confirmada',
            alternativas,
            esRecomendada: elegida.recomendado
        };

        this.asignaciones.push(asignacion);
        this.solicitudes.marcarAsignada(solicitud.id);

        return {
            asignacion_id: asignacion.id,
            estado: 'confirmada',
            costo_estimado: asignacion.costoEstimado,
            estado_vehiculo: 'en_servicio',
            estado_conductor: 'asignado'
        };
    }

    /** Historial de la asignación de una solicitud (contrato PROPUESTO). */
    historial(solicitudId: string): HistorialAsignacionDto {

        const solicitud = this.solicitudes.obtener(solicitudId);

        const asignacion = this.asignaciones.find(
            a => a.solicitudId === solicitudId && a.estado !== 'cancelada'
        );

        if (asignacion === undefined) {
            throw error(404, 'La solicitud no tiene una asignación vigente');
        }

        const conductor = this.conductores.find(c => c.id === asignacion.conductorId)!;

        const historial: HistorialAsignacionDto = {
            asignacion_id: asignacion.id,
            solicitud_id: solicitudId,
            vehiculo_elegido_id: asignacion.vehiculoId,
            conductor_id: conductor.id,
            conductor_nombre: conductor.nombre_completo,
            conductor_codigo: conductor.codigo,
            motivo_seleccion: asignacion.motivo,
            recomendada: asignacion.esRecomendada,
            costo_estimado: asignacion.costoEstimado,
            margen_proyectado: asignacion.margenPrevisto,
            estado_servicio: asignacion.estado === 'finalizada' ? 'finalizado' : 'confirmado',
            alternativas: structuredClone(asignacion.alternativas)
        };

        if (asignacion.margenRegistrado !== undefined) {
            historial.margen_registrado = asignacion.margenRegistrado;
        }
        if (solicitud.recorrido_codigo !== undefined) {
            historial.recorrido_codigo = solicitud.recorrido_codigo;
        }

        return historial;
    }

    /** Libera la asignación cuando se cancela la solicitud. */
    cancelarPorSolicitud(solicitudId: string): void {
        for (const asignacion of this.asignaciones) {
            if (asignacion.solicitudId === solicitudId && asignacion.estado === 'confirmada') {
                asignacion.estado = 'cancelada';
            }
        }
    }

    // ------------------------------------------------------------------

    private sembrar(
        solicitudId: string,
        vehiculoId: string,
        conductorId: string,
        estado: 'confirmada' | 'finalizada',
        descuentoRegistrado?: number
    ): void {

        const solicitud = this.solicitudes.obtener(solicitudId);
        const alternativas = this.evaluar(solicitud, true);
        const elegida = alternativas.find(a => a.vehiculo_id === vehiculoId)!;

        const asignacion: AsignacionSimulada = {
            id: `asg-${vehiculoId}-${solicitud.codigo}`,
            solicitudId,
            vehiculoId,
            conductorId,
            motivo: elegida.recomendado
                ? 'Recomendación óptima del sistema'
                : 'Decisión del coordinador',
            costoEstimado: elegida.costo_estimado,
            margenPrevisto: elegida.margen_proyectado,
            estado,
            alternativas,
            esRecomendada: elegida.recomendado
        };

        if (descuentoRegistrado !== undefined) {
            asignacion.margenRegistrado = elegida.margen_proyectado - descuentoRegistrado;
        }

        this.asignaciones.push(asignacion);
    }

    /** ¿El vehículo o conductor ya tiene un servicio vigente que se cruza? */
    private ocupado(
        recursoId: string,
        solicitud: SolicitudResumenDto,
        tipo: 'vehiculo' | 'conductor'
    ): boolean {

        return this.asignaciones
            .filter(a => a.estado === 'confirmada' && a.solicitudId !== solicitud.id)
            .filter(a => (tipo === 'vehiculo' ? a.vehiculoId : a.conductorId) === recursoId)
            .some(a => secruzan(solicitud, this.solicitudes.obtener(a.solicitudId)));
    }

    /**
     * Evalúa los vehículos con capacidad suficiente.
     * Con `soloElegibles` descarta los que no están disponibles o están
     * ocupados en ese horario; sin él los conserva.
     */
    private evaluar(
        solicitud: SolicitudResumenDto,
        soloElegibles: boolean
    ): AlternativaDetalladaDto[] {

        const kmServicio = solicitud.km_estimados ?? 0;
        const viaticos = kmServicio >= UMBRAL_VIATICOS_KM ? VIATICOS : 0;

        const candidatos = this.flota
            .filter(v => v.capacidad >= solicitud.pasajeros)
            .filter(v => !soloElegibles || (
                v.estado === 'disponible' && !this.ocupado(v.id, solicitud, 'vehiculo')
            ))
            .map(v => {

                const kmVacios = solicitud.origen?.lat !== undefined && solicitud.origen.lng !== undefined
                    ? Math.round(
                        distanciaRectaKm(v.baseLat, v.baseLng, solicitud.origen.lat, solicitud.origen.lng)
                        * FACTOR_CARRETERA * 10
                    ) / 10
                    : 0;

                const kmTotales = Math.round((kmServicio + kmVacios) * 10) / 10;

                const costo = Math.round(
                    (kmTotales / v.rendimientoKmGal) * PRECIO_GALON +
                    kmTotales * v.costoPorKm +
                    v.costoDespacho + viaticos
                );

                return { v, kmVacios, kmTotales, costo, margen: solicitud.tarifa_pactada - costo };
            })
            .sort((a, b) => b.margen - a.margen || a.kmVacios - b.kmVacios);

        const mejor = candidatos[0];

        return candidatos.map((c, indice) => {

            const explicacion = indice === 0
                ? `Mayor margen entre las alternativas elegibles${c.kmVacios > 0 ? `, aun incluyendo ${coma(c.kmVacios)} km sin pasajeros` : ''}.`
                : `Margen ${pesos(mejor!.margen - c.margen)} menor que ${mejor!.v.codigo}; recorre ${coma(c.kmVacios)} km sin pasajeros.`;

            return {
                vehiculo_id: c.v.id,
                codigo: c.v.codigo,
                placa: c.v.placa,
                capacidad_pasajeros: c.v.capacidad,
                km_vacios: c.kmVacios,
                km_totales_estimados: c.kmTotales,
                costo_estimado: c.costo,
                margen_proyectado: c.margen,
                porcentaje_margen: solicitud.tarifa_pactada > 0
                    ? Math.round((c.margen / solicitud.tarifa_pactada) * 10000) / 100
                    : 0,
                recomendado: indice === 0,
                explicacion_criterios: explicacion
            };
        });
    }
}
