import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/public/public.component').then((m) => m.PublicComponent),
    loadChildren: () => import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
];
