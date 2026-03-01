import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, RouterLink, LogoComponent],
  templateUrl: './auth-layout.html',
})
export class AuthLayout {}
