
import { Injectable } from '@angular/core';

import { RepositorioAsignacionesSimulado } from './asignacion.mock';
import { RepositorioSolicitudesSimulado } from './solicitud.mock';

/**
 * Datos de ejemplo compartidos entre los servicios de solicitudes y
 * asignaciones, para que una asignación confirmada cambie el estado
 * de la solicitud y una cancelación libere la asignación.
 *
 * Solo se usa mientras la API de Go no esté configurada.
 */
@Injectable({
    providedIn: 'root'
})
export class AlmacenSimulado {

    readonly solicitudes = new RepositorioSolicitudesSimulado();

    readonly asignaciones = new RepositorioAsignacionesSimulado(this.solicitudes);
}
