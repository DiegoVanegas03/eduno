import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@shared/components/logo/logo.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LogoComponent],
  templateUrl: './footer.component.html',
  standalone: true,
})
export class FooterComponent {}
