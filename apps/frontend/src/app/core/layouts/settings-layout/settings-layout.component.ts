import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { AsideSettingsNavigationComponent } from '@app/core/components/aside-settings-navigation/aside-settings-navigation.component';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@app/shared/components/logo/logo.component';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    BreadcrumbComponent,
    AsideSettingsNavigationComponent,
    CommonModule,
    LogoComponent,
  ],
  templateUrl: './settings-layout.component.html',
  styles: `
    :host {
      background-color: var(--color-cerulean-50);
    }
  `,
})
export class SettingsLayoutComponent {
  isDrawerOpen = signal(false);

  toggleDrawer() {
    this.isDrawerOpen.update((v) => !v);
  }
}
