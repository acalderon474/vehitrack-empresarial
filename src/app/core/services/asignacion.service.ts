
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

import type {
    ConfirmacionAsignacionDto,
    HistorialAsignacionDto,
    ListadoConductoresDto,
    RecomendacionesDetalladasDto
} from '../dto/asignacion-flujo.dto';

import type {
    ConductorDisponible,
    ConfirmacionAsignacion,
    DatosConfirmacionAsignacion,
    HistorialAsignacion,
    RecomendacionesAsignacion
} from '../models/asignacion-flujo';

import {
    conductoresDesdeDto,
    confirmacionDesdeDto,
    confirmarADto,
    historialDesdeDto,
    recomendacionesDesdeDto
} from '../adapters/asignacion-flujo.adapter';

import { AlmacenSimulado } from '../mocks/almacen-simulado';
import { simular } from '../mocks/simulacion';

/**
 * VEHITRACK EMPRESARIAL
 *
 * Servicio de asignaciones: recomendaciones de vehículos (VT-012),
 * confirmación (VT-013) y consulta del historial.
 *
 * Mientras la dirección de la API no esté configurada
 * (environment.apiBaseUrl vacío) responde con datos simulados.
 * Cuando se configure la API, usa el servicio real sin cambios
 * en los componentes.
 */
@Injectable({
    providedIn: 'root'
})
export class AsignacionService {

    private readonly api = inject(ApiService);
    private readonly almacen = inject(AlmacenSimulado);

    /** Indica si se están usando datos simulados. */
    get usaDatosSimulados(): boolean {
        return environment.apiBaseUrl.trim() === '';
    }

    /**
     * VT-012. Alternativas de vehículo para una solicitud pendiente,
     * ordenadas por mayor margen y con la explicación de cada una.
     * GET enterprise/requests/{id}/recommendations
     */
    recomendar(solicitudId: string): Observable<RecomendacionesAsignacion> {

        const respuesta$: Observable<RecomendacionesDetalladasDto> =
            this.usaDatosSimulados
                ? simular(() => this.almacen.asignaciones.recomendar(solicitudId))
                : this.api.get<RecomendacionesDetalladasDto>(
                    `enterprise/requests/${encodeURIComponent(solicitudId)}/recommendations`
                );

        return respuesta$.pipe(map(recomendacionesDesdeDto));
    }

    /**
     * Conductores que se pueden asignar.
     * GET enterprise/drivers?estado=disponible
     */
    listarConductoresDisponibles(): Observable<ConductorDisponible[]> {

        const respuesta$: Observable<ListadoConductoresDto> =
            this.usaDatosSimulados
                ? simular(() => this.almacen.asignaciones.conductoresDisponibles())
                : this.api.get<ListadoConductoresDto>(
                    'enterprise/drivers?estado=disponible&limite=100'
                );

        return respuesta$.pipe(map(conductoresDesdeDto));
    }

    /**
     * VT-013. Confirma la asignación de vehículo y conductor.
     * El servidor valida de nuevo la disponibilidad y recalcula el costo.
     * POST enterprise/assignments
     */
    confirmar(
        datos: DatosConfirmacionAsignacion
    ): Observable<ConfirmacionAsignacion> {

        const dto = confirmarADto(datos);

        const respuesta$: Observable<ConfirmacionAsignacionDto> =
            this.usaDatosSimulados
                ? simular(() => this.almacen.asignaciones.confirmar(dto))
                : this.api.post<ConfirmacionAsignacionDto>(
                    'enterprise/assignments',
                    dto
                );

        return respuesta$.pipe(map(confirmacionDesdeDto));
    }

    /**
     * Asignación ya registrada de una solicitud, con las alternativas
     * que se compararon.
     * GET enterprise/requests/{id}/assignment   [PROPUESTO]
     */
    obtenerHistorial(solicitudId: string): Observable<HistorialAsignacion> {

        const respuesta$: Observable<HistorialAsignacionDto> =
            this.usaDatosSimulados
                ? simular(() => this.almacen.asignaciones.historial(solicitudId))
                : this.api.get<HistorialAsignacionDto>(
                    `enterprise/requests/${encodeURIComponent(solicitudId)}/assignment`
                );

        return respuesta$.pipe(map(historialDesdeDto));
    }
}
