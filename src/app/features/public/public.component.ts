import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../core/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [RouterOutlet, Navbar, FooterComponent],
  templateUrl: './public.html',
})
export class PublicComponent {}
