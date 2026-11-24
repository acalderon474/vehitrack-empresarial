
import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, of } from 'rxjs';

import { ApiService } from './api.service';
import { RecorridosPruebaStore } from '../mocks/recorridos-prueba.store';
import { apiConfigurada, extraerDatos } from '../utils/respuesta-api';

import type {
    FiltrosReporteDto,
    ReporteRentabilidadDto
} from '../dto/reporte.dto';

/**
 * VEHITRACK EMPRESARIAL
 *
 * Servicio de reportes de rentabilidad.
 * Contrato VT-015 de la matriz aprobada.
 *
 * Los cálculos económicos son
 * responsabilidad del backend Go.
 */
@Injectable({
    providedIn: 'root'
})
export class ReporteService {

    private readonly api = inject(ApiService);
    private readonly datosPrueba = inject(RecorridosPruebaStore);

    /**
     * Consulta la rentabilidad de los recorridos
     * dentro de un período determinado.
     *
     * Los filtros de vehículo y conductor
     * son opcionales.
     */
    obtenerRentabilidad(
        filtros: FiltrosReporteDto
    ): Observable<ReporteRentabilidadDto> {

        const parametros = new URLSearchParams({
            desde: filtros.desde,
            hasta: filtros.hasta
        });

        if (filtros.vehiculo_id !== undefined) {
            parametros.set(
                'vehiculo_id',
                filtros.vehiculo_id
            );
        }

        if (filtros.conductor_id !== undefined) {
            parametros.set(
                'conductor_id',
                filtros.conductor_id
            );
        }

        if (!apiConfigurada()) {
            return defer(() => of(this.datosPrueba.reporte(filtros)));
        }

        return this.api.get<unknown>(
            `enterprise/reports/profitability?${parametros.toString()}`
        ).pipe(
            map(respuesta =>
                extraerDatos<ReporteRentabilidadDto>(respuesta)
            )
        );
    }
}
