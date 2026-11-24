import type {
  IndicadoresDashboardDto,
  PeriodoFinanciero,
  ResumenFinancieroDashboardDto,
} from '../dto/dashboard.dto';

export const CORTE_DEMOSTRACION = '2026-11-20';
export const INICIO_DEMOSTRACION = '2026-11-01';

/** Información ficticia del caso académico Operadora Caribe Turístico S.A.S. */
export interface CierreDemostracion {
  codigo: string;
  fecha: string;
  vehiculo: string;
  solicitud: string;
  tarifa: number;
  costoEstimado: number;
  costoReal: number;
}

export const CIERRES_DEMOSTRACION: readonly CierreDemostracion[] = [
  { codigo: 'R-7825', fecha: '2026-11-20', vehiculo: 'QAZ-118', solicitud: 'Hotel Barranquilla → Aeropuerto', tarifa: 120000, costoEstimado: 51000, costoReal: 56000 },
  { codigo: 'R-7824', fecha: '2026-11-18', vehiculo: 'KLM-203', solicitud: 'Hotel → Terminal', tarifa: 150000, costoEstimado: 79000, costoReal: 81000 },
  { codigo: 'R-7823', fecha: '2026-11-16', vehiculo: 'HJK-552', solicitud: 'Hotel → Centro', tarifa: 125000, costoEstimado: 58000, costoReal: 57000 },
  { codigo: 'R-7822', fecha: '2026-11-14', vehiculo: 'WXS-934', solicitud: 'Aeropuerto → Hotel Puerta del Sol', tarifa: 170000, costoEstimado: 92000, costoReal: 90000 },
  { codigo: 'R-7821', fecha: '2026-11-12', vehiculo: 'TRB-417', solicitud: 'Hotel El Prado → Puerto Colombia', tarifa: 110000, costoEstimado: 55000, costoReal: 58000 },
  { codigo: 'R-7820', fecha: '2026-11-10', vehiculo: 'WXS-934', solicitud: 'Barranquilla → Cartagena', tarifa: 200000, costoEstimado: 112000, costoReal: 115000 },
  { codigo: 'R-7819', fecha: '2026-11-08', vehiculo: 'QAZ-118', solicitud: 'Hotel → Aeropuerto', tarifa: 115000, costoEstimado: 58000, costoReal: 60000 },
  { codigo: 'R-7818', fecha: '2026-11-06', vehiculo: 'KLM-203', solicitud: 'Hotel → Malecón', tarifa: 100000, costoEstimado: 50000, costoReal: 53000 },
  { codigo: 'R-7817', fecha: '2026-11-04', vehiculo: 'HJK-552', solicitud: 'Aeropuerto → Hotel Norte', tarifa: 145000, costoEstimado: 81000, costoReal: 80000 },
  { codigo: 'R-7816', fecha: '2026-11-02', vehiculo: 'MNP-781', solicitud: 'Hotel → Zoológico', tarifa: 115000, costoEstimado: 62000, costoReal: 61000 },
];

/** El estado operativo es una instantánea del caso, no telemetría en tiempo real. */
export function indicadoresDemostracion(desde: string, hasta: string): IndicadoresDashboardDto {
  return {
    vehiculos_total: 6,
    vehiculos_disponibles: 4,
    vehiculos_en_servicio: 2,
    solicitudes_pendientes: 1,
    recorridos_finalizados: cierresEntre(desde, hasta).length,
  };
}

export function cierresEntre(desde: string, hasta: string): CierreDemostracion[] {
  return CIERRES_DEMOSTRACION.filter(c => c.fecha >= desde && c.fecha <= hasta);
}

/** El periodo financiero del mock termina en el corte académico 20/11/2026. */
export function rangoFinancieroDemostracion(periodo: PeriodoFinanciero): { desde: string; hasta: string } {
  const desde = periodo === 'semana' ? '2026-11-14'
    : periodo === 'trimestre' ? '2026-10-01' : '2026-11-01';
  return { desde, hasta: CORTE_DEMOSTRACION };
}

export function resumenFinancieroDemostracion(periodo: PeriodoFinanciero): ResumenFinancieroDashboardDto {
  const { desde, hasta } = rangoFinancieroDemostracion(periodo);
  const registros = cierresEntre(desde, hasta);
  const suma = (extraer: (registro: CierreDemostracion) => number): number =>
    registros.reduce((total, item) => total + extraer(item), 0);

  const ingreso_total = suma(c => c.tarifa);
  const costo_estimado = suma(c => c.costoEstimado);
  const costo_real = suma(c => c.costoReal);
  return {
    ingreso_total,
    costo_estimado,
    costo_real,
    margen_estimado: ingreso_total - costo_estimado,
    margen_real: ingreso_total - costo_real,
  };
}

export interface MargenPorVehiculo {
  placa: string;
  margen: number;
  porcentaje: number;
}

export function margenPorVehiculoDemostracion(registros: readonly CierreDemostracion[]): MargenPorVehiculo[] {
  const total = new Map<string, number>();
  for (const cierre of registros) {
    total.set(cierre.vehiculo, (total.get(cierre.vehiculo) ?? 0) + cierre.tarifa - cierre.costoReal);
  }
  const maximo = Math.max(1, ...total.values());
  return [...total.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([placa, margen]) => ({ placa, margen, porcentaje: Math.round((margen / maximo) * 100) }));
}
