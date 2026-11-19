
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

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

    /**
     * VT-004
     * Consultar indicadores operativos
     * del Dashboard empresarial.
     */
    obtenerIndicadores(
        filtros: FiltrosDashboardDto
    ): Observable<IndicadoresDashboardDto> {

        const parametros = new URLSearchParams({
            desde: filtros.desde,
            hasta: filtros.hasta
        });

        return this.api.get<IndicadoresDashboardDto>(
            `enterprise/dashboard/kpis?${parametros.toString()}`
        );
    }

    /**
     * VT-005
     * Consultar el resumen financiero
     * del período seleccionado.
     */
    obtenerResumenFinanciero(
        periodo: PeriodoFinanciero
    ): Observable<ResumenFinancieroDashboardDto> {

        return this.api.get<ResumenFinancieroDashboardDto>(
            `enterprise/dashboard/financial-summary?periodo=${encodeURIComponent(periodo)}`
        );
    }
}
