import { Component, HostListener, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from '@shared/components/user-card/user-card.component';
import { LogoComponent } from '@shared/components/logo/logo.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AuthService } from '@app/core/services/auth/auth.service';

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
    AvatarComponent,
  ],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  authService = inject(AuthService);
  isSidebarCollapsed = signal(false);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 1024;
      const savedState = localStorage.getItem('admin_sidebar_collapsed');
      
      if (isSmallScreen) {
        this.isSidebarCollapsed.set(true);
      } else if (savedState !== null) {
        this.isSidebarCollapsed.set(savedState === 'true');
      }
    }
  }

  toggleSidebar() {
    const newState = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(newState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin_sidebar_collapsed', String(newState));
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        this.isSidebarCollapsed.set(true);
      }
    }
  }
}
