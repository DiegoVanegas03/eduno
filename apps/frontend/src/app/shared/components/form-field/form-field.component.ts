import {
  Component,
  input,
  signal,
  forwardRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type FormFieldType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'search';

// SVG icon paths bundled here to avoid <ng-template> bloat in templates.
// Each key is a semantic name, value is the SVG <path> `d` attribute.
export const FORM_FIELD_ICONS = {
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  email:    'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207',
  password: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  search:   'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z',
} as const;

export type FormFieldIcon = keyof typeof FORM_FIELD_ICONS;

/**
 * `<app-form-field>` — Input reutilizable con icono izquierdo, label y soporte
 * de contraseña con toggle de visibilidad.
 *
 * Compatible con `[(ngModel)]` y `formControlName` a través de ControlValueAccessor.
 *
 * @example
 * <app-form-field
 *   id="email"
 *   name="email"
 *   [(ngModel)]="email"
 *   label="Correo electrónico"
 *   icon="email"
 *   type="email"
 *   placeholder="a000000@alumnos.uaslp.mx"
 *   autocomplete="email"
 * />
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
})
export class FormFieldComponent implements ControlValueAccessor {
  // ── Inputs ────────────────────────────────────────────────────────────────
  id          = input<string>('');
  name        = input<string>('');
  label       = input<string>('');
  type        = input<FormFieldType>('text');
  placeholder = input<string>('');
  autocomplete = input<string>('off');
  required    = input<boolean>(false);
  disabled    = input<boolean>(false);
  hint        = input<string>('');       // Optional helper text below the input
  error       = input<string>('');       // External validation error message
  icon        = input<FormFieldIcon | null>(null);

  // ── Internal state ────────────────────────────────────────────────────────
  value       = signal<string>('');
  showPassword = signal(false);

  // ── CVA callbacks ─────────────────────────────────────────────────────────
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get iconPath(): string | null {
    const key = this.icon();
    return key ? FORM_FIELD_ICONS[key] : null;
  }

  /** Effective input type: respects password toggle. */
  get effectiveType(): string {
    return this.type() === 'password' && this.showPassword() ? 'text' : this.type();
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }
}
