
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AlternativaAsignacion } from '../../../core/models/asignacion-flujo';
import { formatoCop, formatoNumero } from '../../../core/utils/formato';

/**
 * Tarjeta de un vehículo evaluado para una solicitud (diseño de Asignaciones).
 *
 * En modo "consulta" solo muestra los datos. En modo "elegir" permite
 * seleccionar el vehículo para confirmar la asignación (VT-013).
 */
@Component({
    selector: 'app-alternativa-vehiculo',
    styleUrl: './alternativa-vehiculo.scss',
    templateUrl: './alternativa-vehiculo.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlternativaVehiculo {

    readonly alternativa = input.required<AlternativaAsignacion>();

    /** Letra que identifica la tarjeta: A, B, C... */
    readonly letra = input.required<string>();

    readonly modo = input<'consulta' | 'elegir'>('consulta');

    /** Vehículo elegido por el coordinador. */
    readonly elegida = input(false);

    /** Vehículo con el que se confirmó la asignación (vista de historial). */
    readonly confirmada = input(false);

    readonly elegir = output<string>();

    formatoCop(valor: number): string {
        return formatoCop(valor);
    }

    formatoNumero(valor: number, decimales = 1): string {
        return formatoNumero(valor, decimales);
    }
}
