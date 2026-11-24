import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
});

/**
 * Muestra un valor en pesos colombianos sin decimales.
 *
 * {{ 56000 | cop }}        → $56.000
 * {{ 5000 | cop: true }}   → +$5.000
 * {{ -5000 | cop }}        → −$5.000
 */
@Pipe({
    name: 'cop'
})
export class CopPipe implements PipeTransform {

    transform(
        valor: number | null | undefined,
        conSigno = false
    ): string {

        if (valor === null || valor === undefined || Number.isNaN(valor)) {
            return '—';
        }

        const cifra = `$${formato.format(Math.abs(valor))}`;

        if (valor < 0) {
            return `−${cifra}`;
        }

        return conSigno && valor > 0 ? `+${cifra}` : cifra;
    }
}
