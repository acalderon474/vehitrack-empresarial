import { PERIODO_DATOS_PRUEBA, RecorridosPruebaStore } from './recorridos-prueba.store';

describe('Datos de prueba de Recorridos', () => {

    let store: RecorridosPruebaStore;

    const sinGastos = {
        km_reales: 1,
        costo_combustible: 0,
        costo_peajes: 0,
        costo_mantenimiento: 0,
        costo_conductor: 0,
        otros_gastos: 0
    };

    beforeEach(() => {
        store = new RecorridosPruebaStore();
    });

    it('debe tener 2 recorridos en curso y 10 cerrados', () => {
        const lista = store.listar();

        expect(lista.filter(r => r.estado === 'en_curso').length).toBe(2);
        expect(lista.filter(r => r.estado === 'finalizado').length).toBe(10);
    });

    it('debe asignar a cada conductor su nombre y su código', () => {
        const r = store.listar().find(x => x.codigo === 'R-7825');

        expect(r?.conductor_id).toBe('con-003');
        expect(r?.conductor_codigo).toBe('C-003');
        expect(r?.conductor_nombre).toBe('Marta Ospina');
        expect(store.listar().every(x => x.conductor_nombre !== x.conductor_codigo)).toBe(true);
    });

    it('debe coincidir con el cierre R-7825 de los diseños', () => {
        const r = store.listar().find(x => x.codigo === 'R-7825');

        expect(r?.costo_estimado).toBe(51000);
        expect(r?.costo_real).toBe(56000);
        expect(r?.desviacion_costos).toBe(5000);
        expect(r?.margen_real).toBe(64000);
    });

    it('debe reproducir los totales del reporte de los diseños', () => {
        const reporte = store.reporte({ desde: '2026-11-01', hasta: '2026-11-20' });

        expect(reporte.recorridos.length).toBe(10);
        expect(reporte.resumen).toEqual({
            tarifa_total: 1350000,
            costo_estimado_total: 698000,
            costo_real_total: 711000,
            desviacion: 13000
        });
    });

    it('debe filtrar el reporte por período, vehículo y conductor', () => {
        expect(store.reporte({ desde: '2026-11-19', hasta: '2026-11-20' }).recorridos.length)
            .toBe(1);

        expect(store.reporte({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            vehiculo_id: 'veh-103'
        }).recorridos.map(r => r.codigo)).toEqual(['R-7825', 'R-7819']);

        expect(store.reporte({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            conductor_id: 'con-004'
        }).recorridos.map(r => r.codigo)).toEqual(['R-7822', 'R-7820']);

        expect(store.reporte({
            desde: '2026-11-01',
            hasta: '2026-11-30',
            vehiculo_id: 'veh-103',
            conductor_id: 'con-004'
        }).recorridos.length).toBe(0);
    });

    it('debe cubrir todos los cierres de prueba con el período de demostración', () => {
        expect(store.reporte(PERIODO_DATOS_PRUEBA).recorridos.length).toBe(10);
    });

    it('debe cerrar un recorrido en curso', () => {
        const resultado = store.cerrar('asg-7826', {
            km_reales: 15,
            costo_combustible: 20000,
            costo_peajes: 5000,
            costo_mantenimiento: 4000,
            costo_conductor: 12000,
            otros_gastos: 0
        });

        expect(resultado.costo_real).toBe(41000);
        expect(resultado.desviacion_costos).toBe(0);
        expect(resultado.margen_real).toBe(54000);

        const cerrado = store.listar().find(r => r.asignacion_id === 'asg-7826');
        expect(cerrado?.estado).toBe('finalizado');
    });

    it('no debe cerrar dos veces ni cerrar asignaciones inexistentes', () => {
        expect(() => store.cerrar('asg-7825', sinGastos)).toThrow();
        expect(() => store.cerrar('no-existe', sinGastos)).toThrow();
    });

    it('no debe exponer su estado interno', () => {
        store.listar()[0].codigo = 'modificado';
        expect(store.listar()[0].codigo).not.toBe('modificado');
    });

});
