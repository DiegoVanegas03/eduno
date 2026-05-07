import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { NgxSonnerToaster, toast } from 'ngx-sonner';

import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSonnerToaster, ModalComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  authService = inject(AuthService);
  protected readonly title = signal('eduno');
  protected readonly toast = toast;

  ngOnInit(): void {
    this.authService.checkSession().subscribe();
  }
}