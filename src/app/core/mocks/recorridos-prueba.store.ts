import { Injectable } from '@angular/core';

import type {
    CerrarRecorridoDto,
    GastosRecorridoDto,
    RecorridoSeguimientoDto,
    ResultadoCierreRecorridoDto
} from '../dto/recorrido.dto';

import type {
    FiltrosReporteDto,
    ReporteRentabilidadDto
} from '../dto/reporte.dto';

/**
 * Datos de prueba del caso académico
 * Operadora Caribe Turístico S.A.S.
 *
 * Se usan mientras la API empresarial no esté
 * conectada. Las cifras coinciden con los diseños
 * de Recorridos y Reportes. Los cálculos de este
 * archivo simulan lo que hará el backend Go.
 */

/**
 * Período que cubren los recorridos cerrados de prueba
 * (01 al 20 de noviembre de 2026, como en los diseños).
 */
export const PERIODO_DATOS_PRUEBA = {
    desde: '2026-11-01',
    hasta: '2026-11-20'
} as const;

const ID_VEHICULO: Record<string, string> = {
    'KLM-203': 'veh-101',
    'TRB-417': 'veh-102',
    'QAZ-118': 'veh-103',
    'HJK-552': 'veh-104',
    'MNP-781': 'veh-105',
    'WXS-934': 'veh-106'
};

function idConductor(codigo: string): string {
    return codigo.replace('C-', 'con-');
}

function gastos(
    combustible: number,
    peajes: number,
    mantenimiento: number,
    conductor: number,
    otros: number
): GastosRecorridoDto {
    return {
        costo_combustible: combustible,
        costo_peajes: peajes,
        costo_mantenimiento: mantenimiento,
        costo_conductor: conductor,
        otros_gastos: otros
    };
}

function totalGastos(g: GastosRecorridoDto): number {
    return g.costo_combustible + g.costo_peajes +
        g.costo_mantenimiento + g.costo_conductor + g.otros_gastos;
}

function cerrado(
    numero: number,
    solicitud: string,
    origen: string,
    destino: string,
    placa: string,
    conductor: string,
    dia: number,
    tarifa: number,
    costoEstimado: number,
    km: number,
    g: GastosRecorridoDto
): RecorridoSeguimientoDto {
    const costoReal = totalGastos(g);
    const fecha = `2026-11-${String(dia).padStart(2, '0')}`;

    return {
        id: `rec-${numero}`,
        codigo: `R-${numero}`,
        asignacion_id: `asg-${numero}`,
        solicitud_codigo: solicitud,
        origen,
        destino,
        vehiculo_id: ID_VEHICULO[placa] ?? placa,
        placa,
        conductor_id: idConductor(conductor),
        conductor,
        estado: 'finalizado',
        fecha_inicio: `${fecha}T08:00:00Z`,
        fecha_fin: `${fecha}T11:00:00Z`,
        tarifa_pactada: tarifa,
        costo_estimado: costoEstimado,
        margen_estimado: tarifa - costoEstimado,
        km_reales: km,
        costo_real: costoReal,
        desviacion_costos: costoReal - costoEstimado,
        margen_real: tarifa - costoReal,
        gastos: g
    };
}

function enCurso(
    numero: number,
    solicitud: string,
    origen: string,
    destino: string,
    placa: string,
    conductor: string,
    tarifa: number,
    costoEstimado: number
): RecorridoSeguimientoDto {
    return {
        id: `rec-${numero}`,
        codigo: `R-${numero}`,
        asignacion_id: `asg-${numero}`,
        solicitud_codigo: solicitud,
        origen,
        destino,
        vehiculo_id: ID_VEHICULO[placa] ?? placa,
        placa,
        conductor_id: idConductor(conductor),
        conductor,
        estado: 'en_curso',
        fecha_inicio: '2026-11-20T14:30:00Z',
        tarifa_pactada: tarifa,
        costo_estimado: costoEstimado,
        margen_estimado: tarifa - costoEstimado
    };
}

export function crearRecorridosPrueba(): RecorridoSeguimientoDto[] {
    return [
        enCurso(7827, 'S-4591', 'Aeropuerto', 'Hotel Norte', 'MNP-781', 'C-005', 130000, 60000),
        enCurso(7826, 'S-4588', 'Hotel El Prado', 'Centro de eventos', 'TRB-417', 'C-002', 95000, 41000),
        cerrado(7825, 'S-4587', 'Hotel Barranquilla', 'Aeropuerto', 'QAZ-118', 'C-003', 20, 120000, 51000, 25.2, gastos(24000, 8000, 5000, 18000, 1000)),
        cerrado(7824, 'S-4579', 'Hotel', 'Terminal', 'KLM-203', 'C-001', 18, 150000, 79000, 31.5, gastos(35000, 12000, 9000, 22000, 3000)),
        cerrado(7823, 'S-4575', 'Hotel', 'Centro', 'HJK-552', 'C-006', 16, 125000, 58000, 22.4, gastos(25000, 9000, 6000, 16000, 1000)),
        cerrado(7822, 'S-4571', 'Aeropuerto', 'Hotel Puerta del Sol', 'WXS-934', 'C-004', 14, 170000, 92000, 38.0, gastos(40000, 14000, 10000, 24000, 2000)),
        cerrado(7821, 'S-4566', 'Hotel El Prado', 'Puerto Colombia', 'TRB-417', 'C-002', 12, 110000, 55000, 27.8, gastos(26000, 8000, 6000, 17000, 1000)),
        cerrado(7820, 'S-4562', 'Barranquilla', 'Cartagena', 'WXS-934', 'C-004', 10, 200000, 112000, 129.5, gastos(48000, 22000, 12000, 30000, 3000)),
        cerrado(7819, 'S-4558', 'Hotel', 'Aeropuerto', 'QAZ-118', 'C-003', 8, 115000, 58000, 24.6, gastos(26000, 8000, 6000, 18000, 2000)),
        cerrado(7818, 'S-4553', 'Hotel', 'Malecón', 'KLM-203', 'C-001', 6, 100000, 50000, 19.3, gastos(23000, 6000, 5000, 17000, 2000)),
        cerrado(7817, 'S-4549', 'Aeropuerto', 'Hotel Norte', 'HJK-552', 'C-006', 4, 145000, 81000, 33.1, gastos(35000, 12000, 9000, 22000, 2000)),
        cerrado(7816, 'S-4545', 'Hotel', 'Zoológico', 'MNP-781', 'C-005', 2, 115000, 62000, 26.7, gastos(27000, 9000, 6000, 18000, 1000))
    ];
}

/**
 * Almacén en memoria con el estado de los datos
 * de prueba durante la sesión del navegador.
 */
@Injectable({
    providedIn: 'root'
})
export class RecorridosPruebaStore {

    private recorridos = crearRecorridosPrueba();

    listar(): RecorridoSeguimientoDto[] {
        return structuredClone(this.recorridos);
    }

    /**
     * Simula VT-014: registra los gastos reales
     * y devuelve el resultado económico del cierre.
     */
    cerrar(
        asignacionId: string,
        datos: CerrarRecorridoDto
    ): ResultadoCierreRecorridoDto {

        const recorrido = this.recorridos.find(
            r => r.asignacion_id === asignacionId
        );

        if (!recorrido) {
            throw new Error('La asignación indicada no existe.');
        }

        if (recorrido.estado === 'finalizado') {
            throw new Error('El recorrido ya fue cerrado.');
        }

        const g = gastos(
            datos.costo_combustible,
            datos.costo_peajes,
            datos.costo_mantenimiento,
            datos.costo_conductor,
            datos.otros_gastos
        );

        const costoReal = totalGastos(g);
        const margenReal = recorrido.tarifa_pactada - costoReal;

        Object.assign(recorrido, {
            estado: 'finalizado',
            fecha_fin: new Date().toISOString(),
            km_reales: datos.km_reales,
            costo_real: costoReal,
            desviacion_costos: costoReal - recorrido.costo_estimado,
            margen_real: margenReal,
            gastos: g
        });

        return {
            recorrido_id: recorrido.id,
            tarifa_pactada: recorrido.tarifa_pactada,
            costo_estimado: recorrido.costo_estimado,
            costo_real: costoReal,
            desviacion_costos: costoReal - recorrido.costo_estimado,
            margen_real: margenReal,
            porcentaje_margen_real: recorrido.tarifa_pactada > 0
                ? Math.round(margenReal / recorrido.tarifa_pactada * 10000) / 100
                : 0
        };
    }

    /**
     * Simula VT-015 a partir de los recorridos cerrados.
     */
    reporte(filtros: FiltrosReporteDto): ReporteRentabilidadDto {

        const cerrados = this.recorridos.filter(r => {
            const fecha = (r.fecha_fin ?? '').slice(0, 10);

            return r.estado === 'finalizado' &&
                fecha >= filtros.desde &&
                fecha <= filtros.hasta &&
                (filtros.vehiculo_id === undefined || r.vehiculo_id === filtros.vehiculo_id) &&
                (filtros.conductor_id === undefined || r.conductor_id === filtros.conductor_id);
        });

        const suma = (valor: (r: RecorridoSeguimientoDto) => number) =>
            cerrados.reduce((total, r) => total + valor(r), 0);

        const costoEstimado = suma(r => r.costo_estimado);
        const costoReal = suma(r => r.costo_real ?? 0);

        return {
            resumen: {
                tarifa_total: suma(r => r.tarifa_pactada),
                costo_estimado_total: costoEstimado,
                costo_real_total: costoReal,
                desviacion: costoReal - costoEstimado
            },
            recorridos: cerrados.map(r => ({
                codigo: r.codigo,
                placa: r.placa,
                margen_estimado: r.margen_estimado,
                margen_real: r.margen_real ?? 0
            }))
        };
    }
}
