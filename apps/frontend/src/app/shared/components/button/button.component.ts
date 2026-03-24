import { Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  customClass = input<string>('', { alias: 'class' }); // Allow passing custom classes utility-first

  @Output() onClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-full transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    // Size Classes
    const sizeClasses = {
      sm: 'py-2 px-4 text-sm',
      md: 'py-2.5 px-6 text-base',
      lg: 'py-4 px-8 text-lg',
    };

    // Variant Classes using our design system colors
    const variantClasses = {
      primary:
        'bg-punch-red-500 hover:bg-punch-red-600 hover:shadow-lg hover:-translate-y-0.5 text-white shadow-punch-red-500/30 active:translate-y-0',
      secondary:
        'bg-white hover:bg-cerulean-50 text-oxford-navy-700 border-2 border-cerulean-100 shadow-sm hover:shadow-md active:bg-cerulean-100',
      danger:
        'bg-transparent hover:bg-punch-red-50 text-punch-red-600 border-2 border-punch-red-500 hover:shadow-md active:bg-punch-red-100',
      ghost:
        'bg-transparent hover:bg-oxford-navy-50 text-oxford-navy-600 hover:text-oxford-navy-900 shadow-none',
    };

    return `${baseClasses} ${sizeClasses[this.size()]} ${variantClasses[this.variant()]} ${this.customClass()}`;
  }

  handleClick(event: Event) {
    if (!this.disabled()) {
      this.onClick.emit(event);
    }
  }
}
