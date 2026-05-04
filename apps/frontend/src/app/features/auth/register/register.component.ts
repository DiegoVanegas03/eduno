import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ButtonComponent } from '@shared/components/button/button.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { AuthService } from '@app/core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ButtonComponent, ReactiveFormsModule, FormFieldComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Status
  isLoading = signal(false);
  errorMessage = signal('');

  // Form Definition
  registerForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  private passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  // Getters for easy access in template
  get f() {
    return this.registerForm.controls;
  }

  get passwordValue() {
    return this.registerForm.get('password')?.value || '';
  }

  get hasMinLength() {
    return this.passwordValue.length >= 8;
  }

  get hasUpperAndLowerCase() {
    return /[a-z]/.test(this.passwordValue) && /[A-Z]/.test(this.passwordValue);
  }

  get hasNumbers() {
    return /[0-9]/.test(this.passwordValue);
  }

  get hasSpecialChars() {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue);
  }

  get passwordStrength() {
    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasUpperAndLowerCase) score++;
    if (this.hasNumbers) score++;
    if (this.hasSpecialChars) score++;
    return score; // 0 to 4
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    const { name, email, password } = this.registerForm.value;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al crear la cuenta. Inténtalo de nuevo.',
        );
      },
    });
  }
}
