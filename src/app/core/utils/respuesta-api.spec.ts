import { extraerDatos, extraerLista } from './respuesta-api';

describe('Utilidades de respuesta de la API', () => {

    it('debe extraer data de una respuesta envuelta', () => {
        expect(extraerDatos({ errors: [], data: { id: '1' } }))
            .toEqual({ id: '1' });
    });

    it('debe devolver la respuesta si no viene envuelta', () => {
        expect(extraerDatos({ id: '1' })).toEqual({ id: '1' });
    });

    it('debe aceptar listados como arreglo', () => {
        expect(extraerLista({ errors: [], data: [1, 2] })).toEqual([1, 2]);
    });

    it('debe aceptar listados paginados con elementos', () => {
        expect(extraerLista({ errors: [], data: { elementos: [1], total: 1 } }))
            .toEqual([1]);
    });

    it('debe devolver una lista vacía ante un formato desconocido', () => {
        expect(extraerLista({ errors: [], data: null })).toEqual([]);
    });

});
