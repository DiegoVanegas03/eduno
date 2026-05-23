import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/services/auth/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForAuth().pipe(
    map(() => {
      if (authService.isLoggedIn()) {
        return true;
      }
      // Redirigir al login si no está autenticado guardando a dónde intentaba ir
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};
