import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) expanded!: boolean;
  @Input() colorTheme: 'punch-red' | 'cerulean' | 'oxford-navy' | 'honeydew' = 'cerulean';

  @Output() toggleMenu = new EventEmitter<void>();

  get themeClasses() {
    return {
      'punch-red': { iconBg: 'bg-punch-red-50', iconText: 'text-punch-red-500' },
      cerulean: { iconBg: 'bg-cerulean-100', iconText: 'text-cerulean-600' },
      'oxford-navy': { iconBg: 'bg-oxford-navy-100', iconText: 'text-oxford-navy-600' },
      honeydew: { iconBg: 'bg-honeydew-100', iconText: 'text-honeydew-600' },
    }[this.colorTheme];
  }
}
