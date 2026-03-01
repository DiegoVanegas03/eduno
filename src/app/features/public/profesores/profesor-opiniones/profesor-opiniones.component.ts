import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReviewCard } from '@core/components/review-card/review-card';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-profesor-opiniones',
  standalone: true,
  imports: [RouterLink, ReviewCard, FormsModule, BreadcrumbComponent],
  templateUrl: './profesor-opiniones.component.html',
})
export class ProfesorOpinionesComponent {
  route = inject(ActivatedRoute);
  profesorService = inject(ProfesorService);

  profesor = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.profesorService.getProfesorById(Number(params.get('id')))),
    ),
  );

  // Filtros
  selectedMateria = signal<string>('todas');
  selectedRating = signal<string>('todos');
  sortOrder = signal<string>('recientes'); // recientes, alta, baja

  // Reseñas filtradas y ordenadas
  filteredResenas = computed(() => {
    const prof = this.profesor();
    if (!prof) return [];

    let resenas = [...prof.resenas];

    // Filtrar por Materia
    if (this.selectedMateria() !== 'todas') {
      resenas = resenas.filter((r) => r.materia === this.selectedMateria());
    }

    // Filtrar por Rating
    if (this.selectedRating() !== 'todos') {
      const rating = Number(this.selectedRating());
      resenas = resenas.filter((r) => r.rating === rating);
    }

    // Ordenar
    resenas.sort((a, b) => {
      switch (this.sortOrder()) {
        case 'alta':
          return b.rating - a.rating;
        case 'baja':
          return a.rating - b.rating;
        case 'recientes':
        default:
          // Como los mocks de tiempoAgo son strings como "Hace 2 meses",
          // usaremos el ID como proxy de "más reciente" por propósitos mock.
          // En un escenario real usaríamos `Date`
          return b.id - a.id;
      }
    });

    return resenas;
  });

  getTheme(index: number = 0): 'cerulean' | 'punch-red' {
    return index % 2 === 0 ? 'cerulean' : 'punch-red';
  }
}
