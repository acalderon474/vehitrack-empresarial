
export interface Asignacion {
    id: string;
    solicitudId: string;
    vehiculoId: string;
    conductorId: string;

    kilometrosVaciosEstimados: number;
    costoEstimado: number;
    margenEstimado: number;

    justificacion: string;

    estado: 'propuesta' | 'confirmada' | 'cancelada';
}
