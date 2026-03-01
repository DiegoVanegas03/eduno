import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfesorService } from '../../../core/services/profesor/profesor.service';

@Component({
  selector: 'app-profesores',
  imports: [RouterLink],
  templateUrl: './profesores.component.html',
  standalone: true,
})
export class ProfesoresComponent {
  private profesorService = inject(ProfesorService);
  profesores = toSignal(this.profesorService.getProfesores(), { initialValue: [] });
}
