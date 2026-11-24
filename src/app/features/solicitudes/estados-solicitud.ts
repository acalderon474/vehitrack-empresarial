
import type { EstadoSolicitud } from '../../core/models/solicitud';

export const ESTADOS_SOLICITUD: readonly EstadoSolicitud[] = [
    'pendiente',
    'asignada',
    'finalizada',
    'cancelada'
];

const ETIQUETAS_ESTADO: Record<EstadoSolicitud, string> = {
    pendiente: 'Pendiente',
    asignada: 'Asignada',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada'
};

export function etiquetaEstado(estado: EstadoSolicitud): string {
    return ETIQUETAS_ESTADO[estado];
}

/** Solo se puede editar o cancelar una solicitud que aún no terminó. */
export function puedeEditar(estado: EstadoSolicitud): boolean {
    return estado === 'pendiente' || estado === 'asignada';
}

export function puedeCancelar(estado: EstadoSolicitud): boolean {
    return estado === 'pendiente' || estado === 'asignada';
}

/**
 * La ruta, la fecha y los pasajeros solo se editan mientras la solicitud
 * está pendiente: con una asignación vigente (o un recorrido activo,
 * que sigue mostrándose como asignada) quedarían inconsistentes con
 * el vehículo y el costo ya confirmados.
 */
export function rutaEditable(estado: EstadoSolicitud): boolean {
    return estado === 'pendiente';
}
