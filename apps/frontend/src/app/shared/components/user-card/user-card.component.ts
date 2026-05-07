import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, USER_ROLES } from '@app/core/services/auth/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './user-card.component.html',
})
export class UserCardComponent {
  authService = inject(AuthService);
  elementRef = inject(ElementRef);

  isDropdownOpen = signal(false);
  Roles = USER_ROLES;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Si el clic ocurre fuera de este componente, cerramos el dropdown
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  onLogout(event: Event) {
    event.preventDefault();
    this.isDropdownOpen.set(false);
    this.authService.logout();
  }
}
