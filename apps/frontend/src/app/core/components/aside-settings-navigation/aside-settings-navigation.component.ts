import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export interface SettingNavigation {
  label: string;
  link: string;
  fragment?: string;
}

@Component({
  selector: 'app-aside-settings-navigation',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
  template: `
    <div [class]="cssClass()">
      <h3
        class="font-semibold mb-4 cursor-pointer"
        [routerLink]="section().link"
        [fragment]="section().fragment"
        routerLinkActive="text-punch-red-600"
        [routerLinkActiveOptions]="{ exact: false }"
      >
        {{ section().label }}
      </h3>
      <ul class="flex flex-col gap-3 text-xs text-gray-400 font-medium ml-6">
        @for (item of items(); track item.link + item.fragment) {
          <li class="hover:text-punch-red-500 transition-colors cursor-pointer">
            <a
              [routerLink]="item.link"
              [fragment]="item.fragment"
              [class.text-punch-red-600]="isActive(item)"
            >
              {{ item.label }}
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class AsideSettingsNavigationComponent {
  items = input<SettingNavigation[]>([]);
  section = input.required<SettingNavigation>();
  cssClass = input('');

  private route = inject(ActivatedRoute);
  urlFragment = toSignal(this.route.fragment);

  isActive(item: SettingNavigation): boolean {
    return this.urlFragment() === (item.fragment || null);
  }
}
