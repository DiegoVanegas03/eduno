import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
})
export class LogoComponent {
  cssClass = input('w-8 h-8 text-punch-red-500');
}
