import { CopPipe } from './cop.pipe';

describe('CopPipe', () => {

    const pipe = new CopPipe();

    it('debe formatear pesos colombianos sin decimales', () => {
        expect(pipe.transform(56000)).toBe('$56.000');
        expect(pipe.transform(1350000)).toBe('$1.350.000');
    });

    it('debe mostrar el signo negativo', () => {
        expect(pipe.transform(-5000)).toBe('−$5.000');
    });

    it('debe mostrar el signo positivo cuando se solicita', () => {
        expect(pipe.transform(5000, true)).toBe('+$5.000');
        expect(pipe.transform(0, true)).toBe('$0');
    });

    it('debe mostrar un guion cuando no hay valor', () => {
        expect(pipe.transform(undefined)).toBe('—');
        expect(pipe.transform(null)).toBe('—');
    });

});
