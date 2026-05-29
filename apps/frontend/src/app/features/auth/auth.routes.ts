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
    path: 'my-account',
    loadComponent: () =>
      import('@core/layouts/my-account-layout/my-account-layout.component').then(
        (m) => m.MyAccountLayoutComponent,
      ),
    children: [
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/security.component').then((m) => m.SecurityComponent),
      },
      {
        path: 'uploads',
        loadComponent: () =>
          import('./uploads/uploads.component').then((m) => m.UploadsComponent),
      },
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full',
      },
    ],
  },
];
