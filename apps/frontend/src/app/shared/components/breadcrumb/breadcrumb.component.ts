import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: RouterLink['routerLink'];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav
      class="flex items-center text-sm text-oxford-navy-500 font-medium justify-between"
      [class]="cssClass()"
    >
      <div class="flex items-center flex-wrap shrink-0">
        @for (item of items(); track item.label + $index; let last = $last) {
          @if (item.link) {
            <a [routerLink]="item.link" class="hover:text-punch-red-500 transition-colors">{{
              item.label
            }}</a>
          } @else {
            <span class="text-oxford-navy-800">{{ item.label }}</span>
          }

          @if (!last) {
            <span class="mx-2 text-oxford-navy-300">/</span>
          }
        }
      </div>

      <div class="flex items-center">
        <ng-content></ng-content>
      </div>
    </nav>
  `,
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
  cssClass = input('mb-6');
}
