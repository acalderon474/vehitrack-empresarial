import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Solicitudes } from './solicitudes';
import { SolicitudFormulario } from './solicitud-formulario/solicitud-formulario';
import { SolicitudService } from '../../core/services/solicitud.service';

import type { SolicitudResumen } from '../../core/models/solicitud-resumen';

describe('Solicitudes', () => {
  let component: Solicitudes;
  let fixture: ComponentFixture<Solicitudes>;
  let listar: ReturnType<typeof vi.fn>;

  const pendiente: SolicitudResumen = {
    id: 'id-14',
    codigo: 'SOL-2026-014',
    nombreCliente: 'Clínica Portoazul',
    cantidadPasajeros: 12,
    tarifa: 650000,
    estado: 'pendiente',
  };

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;

  function boton(texto: string): HTMLButtonElement | undefined {
    return Array.from(raiz().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => (b.textContent ?? '').trim() === texto,
    );
  }

  beforeEach(async () => {
    listar = vi.fn().mockReturnValue(of({ elementos: [pendiente], total: 1 }));

    await TestBed.configureTestingModule({
      imports: [Solicitudes],
      providers: [
        {
          provide: SolicitudService,
          useValue: {
            listar,
            cambiarEstado: vi.fn().mockReturnValue(of(undefined)),
            crear: vi.fn(),
            actualizar: vi.fn().mockReturnValue(of(undefined)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Solicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el título y el listado', () => {
    expect(raiz().querySelector('h1')?.textContent).toContain('Solicitudes');
    expect(raiz().textContent).toContain('SOL-2026-014');
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('no debe mostrar el formulario hasta pedirlo', () => {
    expect(raiz().querySelector('app-solicitud-formulario')).toBeNull();
  });

  it('debe mostrar y ocultar el formulario de registro', () => {
    boton('Nueva solicitud')?.click();
    fixture.detectChanges();

    expect(raiz().querySelector('app-solicitud-formulario')).not.toBeNull();
    expect(raiz().textContent).toContain('Registrar solicitud de transporte');

    boton('Ocultar formulario')?.click();
    fixture.detectChanges();

    expect(raiz().querySelector('app-solicitud-formulario')).toBeNull();
  });

  it('debe abrir el formulario de edición al pulsar Editar', () => {
    raiz()
      .querySelector<HTMLButtonElement>('button[aria-label="Editar la solicitud SOL-2026-014"]')
      ?.click();
    fixture.detectChanges();

    expect(component.enEdicion()).toEqual(pendiente);
    expect(raiz().textContent).toContain('Editar solicitud SOL-2026-014');
  });

  it('no debe mostrar a la vez el registro y la edición', () => {
    component.iniciarEdicion(pendiente);
    component.alternarNueva();
    fixture.detectChanges();

    expect(component.enEdicion()).toBeNull();
    expect(component.mostrandoNueva()).toBe(true);

    component.iniciarEdicion(pendiente);
    expect(component.mostrandoNueva()).toBe(false);
  });

  it('debe recargar el listado después de registrar una solicitud', () => {
    boton('Nueva solicitud')?.click();
    fixture.detectChanges();
    listar.mockClear();

    const formulario = fixture.debugElement.children
      .flatMap((c) => c.queryAll((d) => d.componentInstance instanceof SolicitudFormulario))
      .at(0)?.componentInstance as SolicitudFormulario;

    formulario.registrada.emit({
      id: 'nuevo',
      codigo: 'SOL-2026-015',
      nombreCliente: 'X',
      origen: { direccion: 'A' },
      destino: { direccion: 'B' },
      fechaHora: '2099-01-01T00:00:00.000Z',
      cantidadPasajeros: 1,
      tarifa: 1,
      estado: 'pendiente',
    });

    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('debe cerrar la edición y recargar el listado al guardar', () => {
    component.iniciarEdicion(pendiente);
    fixture.detectChanges();
    listar.mockClear();

    component.alGuardar();
    fixture.detectChanges();

    expect(component.enEdicion()).toBeNull();
    expect(raiz().querySelector('app-solicitud-formulario')).toBeNull();
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('debe cerrar los formularios al pedirlo', () => {
    component.alternarNueva();
    component.cerrarFormularios();

    expect(component.mostrandoNueva()).toBe(false);
    expect(component.enEdicion()).toBeNull();
  });
});
