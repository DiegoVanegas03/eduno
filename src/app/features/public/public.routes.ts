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
];
