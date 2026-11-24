
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

import type {
    FiltrosDashboardDto,
    IndicadoresDashboardDto,
    PeriodoFinanciero,
    ResumenFinancieroDashboardDto
} from '../dto/dashboard.dto';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly api = inject(ApiService);

    private readonly rutaDashboard =
        environment.dashboardApiPath;

    // VT-004: indicadores operativos.
    obtenerIndicadores(
        filtros: FiltrosDashboardDto
    ): Observable<IndicadoresDashboardDto> {

        const parametros = new URLSearchParams({
            desde: filtros.desde,
            hasta: filtros.hasta
        });

        return this.api.get<IndicadoresDashboardDto>(
            `${this.rutaDashboard}/kpis?${parametros.toString()}`
        );
    }

    // VT-005: resumen financiero.
    obtenerResumenFinanciero(
        periodo: PeriodoFinanciero
    ): Observable<ResumenFinancieroDashboardDto> {

        return this.api.get<ResumenFinancieroDashboardDto>(
            `${this.rutaDashboard}/financial-summary?periodo=${encodeURIComponent(periodo)}`
        );
    }
}
