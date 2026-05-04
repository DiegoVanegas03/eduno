import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/services/auth/auth.service';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, LogoComponent],
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  authService = inject(AuthService);

  loginWithSocial(provider: 'google' | 'microsoft') {
    this.authService.socialLogin(provider);
  }
}
