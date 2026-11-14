import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.Dashboard)
  },
  {
    path: 'vehiculos',
    loadComponent: () =>
      import('./features/vehiculos/vehiculos')
        .then(m => m.Vehiculos)
  },
  {
    path: 'conductores',
    loadComponent: () =>
      import('./features/conductores/conductores')
        .then(m => m.Conductores)
  },
  {
    path: 'solicitudes',
    loadComponent: () =>
      import('./features/solicitudes/solicitudes')
        .then(m => m.Solicitudes)
  },
  {
    path: 'asignaciones',
    loadComponent: () =>
      import('./features/asignaciones/asignaciones')
        .then(m => m.Asignaciones)
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./features/reportes/reportes')
        .then(m => m.Reportes)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
