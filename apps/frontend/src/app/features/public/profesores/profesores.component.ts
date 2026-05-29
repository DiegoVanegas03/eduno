import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { FormsModule } from '@angular/forms';
import { Profesor } from '@core/models/profesor.model';
import { ACADEMIC_AREAS } from '@eduno/shared';
import { ProfesorCardComponent } from '@shared/components/profesor-card/profesor-card.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-profesores',
  imports: [FormsModule, ProfesorCardComponent],
  templateUrl: './profesores.component.html',
  standalone: true,
})
export class ProfesoresComponent implements OnInit {
  private profesorService = inject(ProfesorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Lists
  profesores = signal<Profesor[]>([]);
  trendingProfesores = signal<Profesor[]>([]);

  // Filters
  searchQuery = signal<string>('');
  selectedArea = signal<string>('todas');
  minRating = signal<string>('0');

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  readonly limit = 9;

  // UI State
  showFilters = signal<boolean>(false);
  
  // Academic Areas list for dropdown
  academicAreas = Object.entries(ACADEMIC_AREAS).map(([code, name]) => ({
    code: Number(code),
    name
  }));

  private searchSubject = new Subject<string>();

  constructor() {
    this.route.queryParams.subscribe((params) => {
      this.searchQuery.set(params['q'] || '');
      this.selectedArea.set(params['area'] || 'todas');
      this.minRating.set(params['rating'] || '0');
      this.currentPage.set(Number(params['page']) || 1);
      
      this.loadProfesores();
    });

    // Debounce search input typing to avoid layout shift, input lag, and scroll jumps
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.updateUrl();
    });
  }

  ngOnInit() {
    this.loadTrending();
  }

  loadTrending() {
    this.profesorService.getTrendingProfesores().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.trendingProfesores.set(res.data);
        }
      }
    });
  }

  loadProfesores() {
    const params: any = {
      page: this.currentPage(),
      limit: this.limit,
    };

    if (this.searchQuery().trim()) {
      params.search = this.searchQuery().trim();
    }

    if (this.selectedArea() !== 'todas') {
      params.areaCode = Number(this.selectedArea());
    }

    this.profesorService.getProfesores(params).subscribe({
      next: (res) => {
        if (res.data) {
          let list = res.data;
          const rating = Number(this.minRating());
          if (rating > 0) {
            list = list.filter((p) => p.calificacion >= rating);
          }
          this.profesores.set(list);
          
          if (res.pagination) {
            this.totalPages.set(res.pagination.totalPages);
            this.totalItems.set(res.pagination.totalItems);
          }
        }
      }
    });
  }

  // Helper mapping to maintain frontend compatibility
  filteredProfesores = computed(() => {
    return this.profesores();
  });

  pagesArray = computed(() => {
    const arr = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      arr.push(i);
    }
    return arr;
  });

  // Activar Filtros (Chip UI)
  activeFilters = computed(() => {
    const filters: { type: string; label: string }[] = [];
    if (this.searchQuery()) {
      filters.push({ type: 'q', label: `Búsqueda: "${this.searchQuery()}"` });
    }
    if (this.selectedArea() !== 'todas') {
      const areaName = ACADEMIC_AREAS[Number(this.selectedArea()) as keyof typeof ACADEMIC_AREAS];
      filters.push({ type: 'area', label: `Área: ${areaName}` });
    }
    if (Number(this.minRating()) > 0) {
      filters.push({ type: 'rating', label: `Mínimo ${this.minRating()} ★` });
    }
    return filters;
  });

  updateUrl() {
    const scrollPos = window.scrollY;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchQuery() || null,
        area: this.selectedArea() === 'todas' ? null : this.selectedArea(),
        rating: this.minRating() === '0' ? null : this.minRating(),
        page: this.currentPage() > 1 ? this.currentPage() : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    }).then(() => {
      // Maintain exact scroll position to prevent jumping when filters or search apply
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      });
    });
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  applyFilters() {
    this.currentPage.set(1);
    this.updateUrl();
  }

  removeFilter(type: string) {
    if (type === 'q') this.searchQuery.set('');
    if (type === 'area') this.selectedArea.set('todas');
    if (type === 'rating') this.minRating.set('0');
    this.currentPage.set(1);
    this.updateUrl();
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedArea.set('todas');
    this.minRating.set('0');
    this.currentPage.set(1);
    this.updateUrl();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateUrl();
    }
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  getTheme(index: number = 0): 'cerulean' | 'punch-red' {
    return index % 2 === 0 ? 'cerulean' : 'punch-red';
  }
}
