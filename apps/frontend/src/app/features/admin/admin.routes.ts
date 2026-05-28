import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../core/layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
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
        path: 'manage-schedules',
        loadComponent: () =>
          import('./manage-schedules/manage-schedules.component').then((m) => m.ManageSchedulesComponent),
      },
      {
        path: 'manage-professors',
        loadComponent: () =>
          import('./manage-professors/manage-professors.component').then((m) => m.ManageProfessorsComponent),
      },
      {
        path: 'manage-professors/:id',
        loadComponent: () =>
          import('./professor-profile/professor-profile.component').then((m) => m.ProfessorProfileComponent),
      },
      {
        path: 'manage-files',
        loadComponent: () =>
          import('./manage-files/manage-files.component').then((m) => m.ManageFilesComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
