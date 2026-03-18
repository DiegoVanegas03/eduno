import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role/role-guard';
import { Roles } from '@core/services/auth/auth';

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
      import('./features/public/public.component').then((m) => m.PublicComponent),
    loadChildren: () => import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
];
