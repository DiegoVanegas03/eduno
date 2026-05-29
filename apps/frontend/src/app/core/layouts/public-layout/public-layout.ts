import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '@app/core/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, FooterComponent],
  templateUrl: './public-layout.html',
})
export class PublicLayout {}
