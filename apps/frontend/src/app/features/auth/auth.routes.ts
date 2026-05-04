import { Routes } from '@angular/router';
export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@core/layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayout),
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
  {
    path: 'settings',
    loadComponent: () =>
      import('@core/layouts/settings-layout/settings-layout.component').then(
        (m) => m.SettingsLayoutComponent
      ),
    children: [
      {
        path: 'my-account',
        loadComponent: () =>
          import('./my-account/my-account.component').then((m) => m.MyAccountComponent),
      },
      {
        path: '',
        redirectTo: 'my-account',
        pathMatch: 'full',
      },
    ],
  },
];
