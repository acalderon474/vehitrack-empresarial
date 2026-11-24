
/**
 * Pesos colombianos como en el diseño: "$120.000".
 * Los negativos usan el signo menos: "−$5.000".
 * El separador de miles se pone a mano para que también agrupe
 * los números de cuatro cifras ("$9.500"), que Intl no agrupa en es-CO.
 */
export function formatoCop(valor: number): string {

    const texto = '$' + String(Math.round(Math.abs(valor)))
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return valor < 0 ? `−${texto}` : texto;
}

/** Número con coma decimal y sin ceros sobrantes: 15,4 · 7 · 55,5. */
export function formatoNumero(valor: number, decimales = 1): string {
    return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: decimales,
        useGrouping: false
    }).format(valor);
}
