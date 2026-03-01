import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ButtonComponent, FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email = '';
  password = '';
  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit() {
    this.errorMessage.set('');
    this.isLoading.set(true);

    // Extract username part as our mock backend expects 'diego'
    const username = this.email.split('@')[0] || this.email;

    this.authService.login(username, this.password).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          // Si el login es exitoso, redirigimos al returnUrl de donde venía o a inicio
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error en autenticación');
      },
    });
  }
}
