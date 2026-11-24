import { Component, signal, viewChild } from '@angular/core';

import type { SolicitudResumen } from '../../core/models/solicitud-resumen';

import { SolicitudFormulario } from './solicitud-formulario/solicitud-formulario';
import { SolicitudListado } from './solicitud-listado/solicitud-listado';

@Component({
  imports: [SolicitudFormulario, SolicitudListado],
  selector: 'app-solicitudes',
  styleUrl: './solicitudes.scss',
  templateUrl: './solicitudes.html',
})
export class Solicitudes {

  private readonly listado = viewChild(SolicitudListado);

  /** Muestra el formulario de registro (VT-010). */
  readonly mostrandoNueva = signal(false);

  /** Solicitud que se está editando (VT-011). */
  readonly enEdicion = signal<SolicitudResumen | null>(null);

  alternarNueva(): void {
    this.enEdicion.set(null);
    this.mostrandoNueva.update(visible => !visible);
  }

  iniciarEdicion(solicitud: SolicitudResumen): void {
    this.mostrandoNueva.set(false);
    this.enEdicion.set(solicitud);
  }

  cerrarFormularios(): void {
    this.mostrandoNueva.set(false);
    this.enEdicion.set(null);
  }

  alRegistrar(): void {
    this.listado()?.recargar();
  }

  alGuardar(): void {
    this.enEdicion.set(null);
    this.listado()?.recargar();
  }
}
