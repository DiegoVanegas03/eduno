import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FooterComponent } from '@app/shared/components/footer/footer.component';
import { BreadcrumbComponent } from '@app/shared/components/breadcrumb/breadcrumb.component';
import { AsideSettingsNavigationComponent } from '@app/core/components/aside-settings-navigation/aside-settings-navigation.component';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-my-account-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FooterComponent,
    BreadcrumbComponent,
    AsideSettingsNavigationComponent,
    CommonModule,
    LogoComponent,
  ],
  templateUrl: './my-account-layout.component.html',
  styles: `
    :host {
      background-color: var(--color-cerulean-50);
    }
  `,
})
export class MyAccountLayoutComponent {
  private router = inject(Router);

  isDrawerOpen = signal(false);

  // Se suscribe a los eventos de navegación para tener el URL actualizado
  urlSignal = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // Computa de manera reactiva los ítems del breadcrumb
  breadcrumbItems = computed(() => {
    const url = this.urlSignal();
    const items = [{ label: 'Eduno', link: '/' }, { label: 'Mi cuenta' }];

    if (url.includes('/security')) {
      items.push({ label: 'Seguridad' });
    } else if (url.includes('/uploads')) {
      items.push({ label: 'Subidos' });
    } else {
      items.push({ label: 'Configuración' });
    }

    return items;
  });

  toggleDrawer() {
    this.isDrawerOpen.update((v) => !v);
  }
}
