import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, Role } from '../../services/auth/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Expected roles can be passed in the route definitions using `data: { roles: ['ADMIN'] }`
  const expectedRoles: Role[] = route.data['roles'] || [];

  if (!authService.isLoggedIn) {
    return router.parseUrl('/auth/login');
  }

  if (expectedRoles.length === 0 || authService.hasAnyRole(expectedRoles)) {
    return true;
  }

  // Go to unauthorized / home page if they don't have permission
  return router.parseUrl('/');
};
