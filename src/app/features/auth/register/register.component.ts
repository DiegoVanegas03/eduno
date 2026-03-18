import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@app/core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ButtonComponent, FormsModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form Fields
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  // Status
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.errorMessage.set('');
    this.isLoading.set(true);

    this.authService
      .register(this.name, this.email, this.password)
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/']); // Redirect to home on success
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Error al crear la cuenta. Inténtalo de nuevo.'
          );
        },
      });
  }
}
