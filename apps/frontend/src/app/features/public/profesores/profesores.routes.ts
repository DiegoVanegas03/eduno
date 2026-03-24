import { Routes } from '@angular/router';

export const profesoresRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profesores.component').then((m) => m.ProfesoresComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./profesor-perfil/profesor-perfil.component').then((m) => m.ProfesorPerfilComponent),
  },
  {
    path: ':id/opiniones',
    loadComponent: () =>
      import('./profesor-opiniones/profesor-opiniones.component').then(
        (m) => m.ProfesorOpinionesComponent,
      ),
  },
];
