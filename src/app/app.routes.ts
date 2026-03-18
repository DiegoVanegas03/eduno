import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role/role-guard';
import { Roles } from '@app/core/services/auth/auth.service';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMINISTRADOR] },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/public-layout/public-layout').then((m) => m.PublicLayout),
    loadChildren: () => import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
