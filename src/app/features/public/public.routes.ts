import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing').then((m) => m.Landing),
  },
  {
    path: 'profesores',
    loadChildren: () => import('./profesores/profesores.routes').then((m) => m.profesoresRoutes),
  },
  {
    path: 'tips',
    loadComponent: () => import('./tips/tips.component').then((m) => m.TipsComponent),
  },
  {
    path: 'servicios/horarios',
    loadComponent: () =>
      import('./coming-soon/coming-soon.component').then(
        (m) => m.ComingSoonComponent
      ),
  },
  {
    path: 'servicios/conecta',
    loadComponent: () =>
      import('./coming-soon/coming-soon.component').then(
        (m) => m.ComingSoonComponent
      ),
  },
];
