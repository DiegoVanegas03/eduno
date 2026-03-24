import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.html',
})
export class LogoComponent {
  @Input() class: string = 'w-8 h-8 text-punch-red-500';
}
