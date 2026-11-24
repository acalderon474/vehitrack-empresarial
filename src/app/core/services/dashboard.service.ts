
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

import type {
    FiltrosDashboardDto,
    IndicadoresDashboardDto,
    PeriodoFinanciero,
    ResumenFinancieroDashboardDto
} from '../dto/dashboard.dto';

// Estructura de las respuestas del backend Go.
interface RespuestaApi<T> {
    errors: Array<{
        code: string;
        message: string;
    }>;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly api = inject(ApiService);

    private readonly rutaDashboard = environment.dashboardApiPath;

    /**
     * VT-004
     * Consultar indicadores operativos.
     */
    obtenerIndicadores(
        filtros: FiltrosDashboardDto
    ): Observable<IndicadoresDashboardDto> {

        const parametros = new URLSearchParams({
            desde: filtros.desde,
            hasta: filtros.hasta
        });

        return this.api.get<RespuestaApi<IndicadoresDashboardDto>>(
            `${this.rutaDashboard}/kpis?${parametros.toString()}`
        ).pipe(
            map(respuesta => respuesta.data)
        );
    }

    /**
     * VT-005
     * Consultar resumen financiero.
     */
    obtenerResumenFinanciero(
        periodo: PeriodoFinanciero
    ): Observable<ResumenFinancieroDashboardDto> {

        return this.api.get<RespuestaApi<ResumenFinancieroDashboardDto>>(
            `${this.rutaDashboard}/financial-summary?periodo=${encodeURIComponent(periodo)}`
        ).pipe(
            map(respuesta => respuesta.data)
        );
    }
}
