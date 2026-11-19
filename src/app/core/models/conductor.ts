
export type EstadoConductor =
    | 'disponible'
    | 'asignado'
    | 'descanso';

export interface Conductor {
    id: string;
    nombreCompleto: string;
    categoriaLicencia: string;
    estado: EstadoConductor;

    vehiculoId?: string;
    vencimientoLicencia?: string;
}
