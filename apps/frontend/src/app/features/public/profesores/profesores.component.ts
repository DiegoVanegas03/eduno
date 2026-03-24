import { Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profesores',
  imports: [RouterLink, FormsModule],
  templateUrl: './profesores.component.html',
  standalone: true,
})
export class ProfesoresComponent {
  private profesorService = inject(ProfesorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  profesores = toSignal(this.profesorService.getProfesores(), { initialValue: [] });

  // Filtros
  searchQuery = signal<string>('');
  selectedMateria = signal<string>('todas');
  minRating = signal<string>('0');

  // UI State
  showFilters = signal<boolean>(false);

  constructor() {
    this.route.queryParams.subscribe((params) => {
      this.searchQuery.set(params['q'] || '');
      this.selectedMateria.set(params['materia'] || 'todas');
      this.minRating.set(params['rating'] || '0');
    });
  }

  // Lista constructiva de materias para el Select Dropdown
  availableMaterias = computed(() => {
    const p = this.profesores();
    const mats = new Set(p.map((x) => x.materiaPrincipal));
    return Array.from(mats).sort();
  });

  // Lista Procesada de Profesores
  filteredProfesores = computed(() => {
    let list = this.profesores();
    const query = this.searchQuery().toLowerCase().trim();
    const materia = this.selectedMateria();
    const rating = Number(this.minRating());

    if (query) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query) ||
          p.materiaPrincipal.toLowerCase().includes(query),
      );
    }

    if (materia !== 'todas') {
      list = list.filter((p) => p.materiaPrincipal === materia);
    }

    if (rating > 0) {
      list = list.filter((p) => p.calificacion >= rating);
    }

    return list;
  });

  // Activar Filtros (Chip UI)
  activeFilters = computed(() => {
    const filters: { type: string; label: string }[] = [];
    if (this.searchQuery()) {
      filters.push({ type: 'q', label: `Búsqueda: "${this.searchQuery()}"` });
    }
    if (this.selectedMateria() !== 'todas') {
      filters.push({ type: 'materia', label: `Materia: ${this.selectedMateria()}` });
    }
    if (Number(this.minRating()) > 0) {
      filters.push({ type: 'rating', label: `Mínimo ${this.minRating()} ★` });
    }
    return filters;
  });

  updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchQuery() || null,
        materia: this.selectedMateria() === 'todas' ? null : this.selectedMateria(),
        rating: this.minRating() === '0' ? null : this.minRating(),
      },
      queryParamsHandling: 'merge', // Conservar otros params si los hay
    });
  }

  applyFilters() {
    this.updateUrl();
    // this.showFilters.set(false); // Opcional, para cerrar el acordeón
  }

  removeFilter(type: string) {
    if (type === 'q') this.searchQuery.set('');
    if (type === 'materia') this.selectedMateria.set('todas');
    if (type === 'rating') this.minRating.set('0');
    this.updateUrl();
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedMateria.set('todas');
    this.minRating.set('0');
    this.updateUrl();
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  getTheme(index: number = 0): 'cerulean' | 'punch-red' {
    return index % 2 === 0 ? 'cerulean' : 'punch-red';
  }
}
