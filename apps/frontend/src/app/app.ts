import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  authService = inject(AuthService);
  protected readonly title = signal('eduno');

  ngOnInit(): void {
    this.authService.checkSession().subscribe();
  }
}
