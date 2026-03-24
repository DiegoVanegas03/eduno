import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from '@shared/components/user-card/user-card.component';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    UserCardComponent,
    LogoComponent,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update((v) => !v);
  }
}
