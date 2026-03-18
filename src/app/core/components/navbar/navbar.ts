import { Component, inject, signal, afterNextRender } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { AuthService, Roles } from '@app/core/services/auth/auth.service';
import { UserCardComponent } from '@shared/components/user-card/user-card.component';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, ButtonComponent, LogoComponent, UserCardComponent],
  templateUrl: './navbar.html',
  standalone: true,
})
export class Navbar {
  authService = inject(AuthService);
  router = inject(Router);
  isMobileMenuOpen = signal(false);
  isMobileServicesOpen = signal(false);
  isInitialized = signal(false);
  Roles = Roles;

  constructor() {
    afterNextRender(() => {
      this.isInitialized.set(true);
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((val) => !val);
  }

  toggleMobileServices() {
    this.isMobileServicesOpen.update((val) => !val);
  }

  logout() {
    this.authService.logout();
    this.isMobileMenuOpen.set(false);
  }
}
