
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

import type { NuevaSolicitud, Solicitud } from '../models/solicitud';
import type {
    CambiosSolicitud,
    FiltrosSolicitudes,
    ListadoSolicitudes,
    SolicitudResumen
} from '../models/solicitud-resumen';

import type { SolicitudCreadaDto } from '../dto/solicitud.dto';
import type {
    CambiarEstadoSolicitudDto,
    ListadoSolicitudesDto,
    SolicitudResumenDto
} from '../dto/solicitud-listado.dto';

import { solicitudACrearDto } from '../adapters/solicitud.adapter';
import { solicitudDesdeCreadaDto } from '../adapters/solicitud-creada.adapter';
import {
    cambiosADto,
    filtrosAConsulta,
    listadoSolicitudesDesdeDto,
    solicitudResumenDesdeDto
} from '../adapters/solicitud-listado.adapter';

import { AlmacenSimulado } from '../mocks/almacen-simulado';
import { simular } from '../mocks/simulacion';

/**
 * VEHITRACK EMPRESARIAL
 *
 * Servicio de solicitudes de transporte.
 * Contratos VT-010 (registro) y VT-011 (listado, edición y estados).
 *
 * Mientras la dirección de la API no esté configurada
 * (environment.apiBaseUrl vacío) responde con datos simulados,
 * para poder desarrollar las pantallas sin el backend.
 * Cuando se configure la API, usa el servicio real sin cambios
 * en los componentes.
 */
@Injectable({
    providedIn: 'root'
})
export class SolicitudService {

    private readonly api = inject(ApiService);

    private readonly almacen = inject(AlmacenSimulado);

    private get simulado() {
        return this.almacen.solicitudes;
    }

    /** Indica si se están usando datos simulados. */
    get usaDatosSimulados(): boolean {
        return environment.apiBaseUrl.trim() === '';
    }

    /**
     * VT-010. Registra una solicitud de transporte.
     * POST enterprise/requests
     */
    crear(datos: NuevaSolicitud): Observable<Solicitud> {

        const dto = solicitudACrearDto(datos);

        const respuesta$: Observable<SolicitudCreadaDto> =
            this.usaDatosSimulados
                ? simular(() => this.simulado.crear(dto))
                : this.api.post<SolicitudCreadaDto>(
                    'enterprise/requests',
                    dto
                );

        return respuesta$.pipe(
            map(respuesta => solicitudDesdeCreadaDto(respuesta, datos))
        );
    }

    /**
     * VT-011. Lista las solicitudes, con filtros opcionales por
     * estado y por fecha del servicio (AAAA-MM-DD).
     * GET enterprise/requests?estado=&fecha=
     */
    listar(filtros: FiltrosSolicitudes = {}): Observable<ListadoSolicitudes> {

        const respuesta$: Observable<ListadoSolicitudesDto> =
            this.usaDatosSimulados
                ? simular(() => this.simulado.listar(filtros))
                : this.api.get<ListadoSolicitudesDto>(
                    `enterprise/requests${filtrosAConsulta(filtros)}`
                );

        return respuesta$.pipe(map(listadoSolicitudesDesdeDto));
    }

    /**
     * Consulta una solicitud por su identificador (lo usa Asignaciones).
     * GET enterprise/requests/{id}   [PROPUESTO: la matriz no lo define]
     */
    obtener(id: string): Observable<SolicitudResumen> {

        const respuesta$: Observable<SolicitudResumenDto> =
            this.usaDatosSimulados
                ? simular(() => this.simulado.obtener(id))
                : this.api.get<SolicitudResumenDto>(
                    `enterprise/requests/${encodeURIComponent(id)}`
                );

        return respuesta$.pipe(map(solicitudResumenDesdeDto));
    }

    /**
     * VT-011. Cancela una solicitud (el motivo es obligatorio).
     * PATCH enterprise/requests/{id}/status   [PROPUESTO]
     */
    cambiarEstado(
        id: string,
        cambio: CambiarEstadoSolicitudDto
    ): Observable<void> {

        const respuesta$: Observable<unknown> =
            this.usaDatosSimulados
                ? simular(() => this.simulado.cambiarEstado(id, cambio))
                : this.api.patch<unknown>(
                    `enterprise/requests/${encodeURIComponent(id)}/status`,
                    cambio
                );

        return respuesta$.pipe(map(() => undefined));
    }

    /**
     * VT-011. Edita una solicitud.
     * PATCH enterprise/requests/{id}   [PROPUESTO: la matriz no lo define]
     */
    actualizar(id: string, cambios: CambiosSolicitud): Observable<void> {

        const dto = cambiosADto(cambios);

        const respuesta$: Observable<unknown> =
            this.usaDatosSimulados
                ? simular(() => this.simulado.actualizar(id, dto))
                : this.api.patch<unknown>(
                    `enterprise/requests/${encodeURIComponent(id)}`,
                    dto
                );

        return respuesta$.pipe(map(() => undefined));
    }
}
