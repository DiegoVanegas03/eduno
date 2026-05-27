import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'manage-users',
        loadComponent: () =>
          import('./manage-users/manage-users.component').then((m) => m.ManageUsersComponent),
      },
      {
        path: 'manage-users/:id',
        loadComponent: () =>
          import('./user-profile/user-profile.component').then((m) => m.UserProfileComponent),
      },
      {
        path: 'manage-careers',
        loadComponent: () =>
          import('./manage-careers/manage-careers.component').then((m) => m.ManageCareersComponent),
      },
      {
        path: 'manage-careers/study-plan/:id',
        loadComponent: () =>
          import('./study-plan-viewer/study-plan-viewer.component').then((m) => m.StudyPlanViewerComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
