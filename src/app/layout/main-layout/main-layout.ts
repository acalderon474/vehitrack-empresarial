
import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

  // Nombre de la aplicación.
  readonly appName = 'Vehitrack Empresarial';

  // Opciones del menú lateral.
  readonly menuItems = [
    {
      label: 'Dashboard',
      route: '/dashboard'
    },
    {
      label: 'Vehículos',
      route: '/vehiculos'
    },
    {
      label: 'Conductores',
      route: '/conductores'
    },
    {
      label: 'Solicitudes',
      route: '/solicitudes'
    },
    {
      label: 'Asignaciones',
      route: '/asignaciones'
    },
    {
      label: 'Reportes',
      route: '/reportes'
    }
  ];

}
