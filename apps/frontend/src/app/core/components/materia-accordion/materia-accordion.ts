import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

type ColorTheme = 'punch-red' | 'cerulean' | 'oxford-navy' | 'honeydew';

@Component({
  selector: 'app-materia-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materia-accordion.html',
  host: {
    class: 'block',
  },
})
export class MateriaAccordion {
  title = input.required<string>();
  subtitle = input.required<string>();
  expanded = input.required<boolean>();
  colorTheme = input.required<ColorTheme>();

  toggleMenu = output<void>();

  get themeClasses() {
    return {
      'punch-red': { iconBg: 'bg-punch-red-50', iconText: 'text-punch-red-500' },
      cerulean: { iconBg: 'bg-cerulean-100', iconText: 'text-cerulean-600' },
      'oxford-navy': { iconBg: 'bg-oxford-navy-100', iconText: 'text-oxford-navy-600' },
      honeydew: { iconBg: 'bg-honeydew-100', iconText: 'text-honeydew-600' },
    }[this.colorTheme()];
  }
}
