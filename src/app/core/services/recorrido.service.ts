import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, of } from 'rxjs';

import { ApiService } from './api.service';
import { RecorridosPruebaStore } from '../mocks/recorridos-prueba.store';

import {
    cierreRecorridoADto,
    recorridoSeguimientoDesdeDto
} from '../adapters/recorrido.adapter';

import {
    apiConfigurada,
    extraerDatos,
    extraerLista
} from '../utils/respuesta-api';

import type {
    DatosCierreRecorrido,
    RecorridoSeguimiento
} from '../models/recorrido';

import type {
    RecorridoSeguimientoDto,
    ResultadoCierreRecorridoDto
} from '../dto/recorrido.dto';

/**
 * VEHITRACK EMPRESARIAL
 *
 * Servicio de Recorridos y cierre operativo.
 * Contrato VT-014 de la matriz aprobada.
 *
 * Mientras no haya API configurada,
 * utiliza los datos de prueba del caso académico.
 */
@Injectable({
    providedIn: 'root'
})
export class RecorridoService {

    private readonly api = inject(ApiService);
    private readonly datosPrueba = inject(RecorridosPruebaStore);

    /**
     * Consulta los recorridos en curso y cerrados.
     * Endpoint propuesto: GET /enterprise/trips
     */
    listar(): Observable<RecorridoSeguimiento[]> {

        const fuente$: Observable<RecorridoSeguimientoDto[]> =
            apiConfigurada()
                ? this.api.get<unknown>('enterprise/trips').pipe(
                    map(respuesta =>
                        extraerLista<RecorridoSeguimientoDto>(respuesta)
                    )
                )
                : defer(() => of(this.datosPrueba.listar()));

        return fuente$.pipe(
            map(lista => lista.map(recorridoSeguimientoDesdeDto))
        );
    }

    /**
     * VT-014
     * Registra los gastos reales y cierra el recorrido.
     * POST /enterprise/trips/{asignacion_id}/close-expenses
     */
    cerrarGastos(
        asignacionId: string,
        datos: DatosCierreRecorrido
    ): Observable<ResultadoCierreRecorridoDto> {

        const cuerpo = cierreRecorridoADto(datos);

        if (!apiConfigurada()) {
            return defer(() =>
                of(this.datosPrueba.cerrar(asignacionId, cuerpo))
            );
        }

        return this.api.post<unknown>(
            `enterprise/trips/${encodeURIComponent(asignacionId)}/close-expenses`,
            cuerpo
        ).pipe(
            map(respuesta =>
                extraerDatos<ResultadoCierreRecorridoDto>(respuesta)
            )
        );
    }
}
