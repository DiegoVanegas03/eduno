import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth/auth.service';
import { UserRole } from '@eduno/shared';
import { map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Expected roles can be passed in the route definitions using `data: { roles: ['ADMIN'] }`
  const expectedRoles: UserRole[] = route.data['roles'] || [];

  return authService.waitForAuth().pipe(
    map(() => {
      if (!authService.isLoggedIn()) {
        return router.parseUrl('/auth/login');
      }

      if (expectedRoles.length === 0 || authService.hasAnyRole(expectedRoles)) {
        return true;
      }

      // Go to unauthorized / home page if they don't have permission
      return router.parseUrl('/');
    })
  );
};
