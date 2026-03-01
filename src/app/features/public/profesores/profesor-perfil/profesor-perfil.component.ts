import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ReviewCard } from '../../../../core/components/review-card/review-card';
import { MateriaAccordion } from '../../../../core/components/materia-accordion/materia-accordion';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth/auth';
import { ProfesorService } from '../../../../core/services/profesor/profesor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-profesor-perfil',
  standalone: true,
  imports: [
    RouterLink,
    ReviewCard,
    MateriaAccordion,
    ButtonComponent,
    BreadcrumbComponent,
    DatePipe,
    CommonModule,
  ],
  templateUrl: './profesor-perfil.component.html',
})
export class ProfesorPerfilComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  profesorService = inject(ProfesorService);

  profesor = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.profesorService.getProfesorById(Number(params.get('id')))),
    ),
  );

  expandedMateriaId = signal<number | null>(1);
  isAuthenticated = computed(() => this.authService.isLoggedIn);

  // Estados para paginación y ordenamiento por Grupo ID
  // key: grupoId, value: page number o sort order ('asc' o 'desc')
  grupoPage = signal<Record<number, number>>({});
  grupoSortOrder = signal<Record<number, 'desc' | 'asc'>>({});
  readonly ITEMS_PER_PAGE = 3;

  toggleMateria(id: number) {
    this.expandedMateriaId.set(this.expandedMateriaId() === id ? null : id);
  }

  // Métodos de Helper para la Vista de Recursos
  getGrupoSortOrder(grupoId: number): 'desc' | 'asc' {
    return this.grupoSortOrder()[grupoId] || 'desc'; // Por defecto, más recientes primero
  }

  toggleGrupoSortOrder(grupoId: number) {
    const current = this.getGrupoSortOrder(grupoId);
    this.grupoSortOrder.update((orders) => ({
      ...orders,
      [grupoId]: current === 'desc' ? 'asc' : 'desc',
    }));
    // Reset page to 1 when sorting changes
    this.setGrupoPage(grupoId, 1);
  }

  getGrupoPage(grupoId: number): number {
    return this.grupoPage()[grupoId] || 1;
  }

  setGrupoPage(grupoId: number, page: number) {
    this.grupoPage.update((pages) => ({
      ...pages,
      [grupoId]: page,
    }));
  }

  getProcessedRecursos(grupoId: number, recursos: any[]) {
    if (!recursos || recursos.length === 0) return [];

    // Clonar para no mutar original
    let processed = [...recursos];

    // Sort
    const sortOrder = this.getGrupoSortOrder(grupoId);
    processed.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Pagination
    const page = this.getGrupoPage(grupoId);
    const startIndex = (page - 1) * this.ITEMS_PER_PAGE;

    return processed.slice(startIndex, startIndex + this.ITEMS_PER_PAGE);
  }

  getGrupoTotalPages(recursos: any[]): number {
    if (!recursos) return 1;
    return Math.max(1, Math.ceil(recursos.length / this.ITEMS_PER_PAGE));
  }
}
