import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './register.html',
})
export class RegisterComponent {}
