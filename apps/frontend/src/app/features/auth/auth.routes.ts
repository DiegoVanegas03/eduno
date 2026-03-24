import { Routes } from '@angular/router';
export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../core/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayout),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];
