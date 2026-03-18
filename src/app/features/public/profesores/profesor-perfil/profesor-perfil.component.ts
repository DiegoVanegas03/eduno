import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ReviewCard } from '@core/components/review-card/review-card';
import { MateriaAccordion } from '@core/components/materia-accordion/materia-accordion';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService, Roles } from '@app/core/services/auth/auth.service';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

import { DaysFormatterPipe } from '@shared/pipes/days-formatter.pipe';

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
    DaysFormatterPipe,
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

  initialLetter = computed(() => this.authService.currentUser()?.initialLetter);
  isAuthenticated = computed(() => this.authService.isLoggedIn());
  isAlumno = computed(() => this.authService.hasRole(Roles.ALUMNO));

  viewMode = signal<'active' | 'history'>('active');

  // Estados para paginación y ordenamiento por Materia ID
  // key: materiaId, value: page number o sort order ('asc' o 'desc')
  materiaPage = signal<Record<number, number>>({});
  materiaSortOrder = signal<Record<number, 'desc' | 'asc'>>({});
  readonly ITEMS_PER_PAGE = 3;

  toggleMateria(id: number) {
    this.expandedMateriaId.set(this.expandedMateriaId() === id ? null : id);
  }

  // Métodos de Helper para la Vista de Recursos
  getMateriaSortOrder(materiaId: number): 'desc' | 'asc' {
    return this.materiaSortOrder()[materiaId] || 'desc'; // Por defecto, más recientes primero
  }

  toggleMateriaSortOrder(materiaId: number) {
    const current = this.getMateriaSortOrder(materiaId);
    this.materiaSortOrder.update((orders) => ({
      ...orders,
      [materiaId]: current === 'desc' ? 'asc' : 'desc',
    }));
    // Reset page to 1 when sorting changes
    this.setMateriaPage(materiaId, 1);
  }

  getMateriaPage(materiaId: number): number {
    return this.materiaPage()[materiaId] || 1;
  }

  setMateriaPage(materiaId: number, page: number) {
    this.materiaPage.update((pages) => ({
      ...pages,
      [materiaId]: page,
    }));
  }

  getProcessedRecursos(materiaId: number, recursos: any[]) {
    if (!recursos || recursos.length === 0) return [];

    // Clonar para no mutar original
    let processed = [...recursos];

    // Sort
    const sortOrder = this.getMateriaSortOrder(materiaId);
    processed.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Pagination
    const page = this.getMateriaPage(materiaId);
    const startIndex = (page - 1) * this.ITEMS_PER_PAGE;

    return processed.slice(startIndex, startIndex + this.ITEMS_PER_PAGE);
  }

  getMateriaTotalPages(recursos: any[]): number {
    if (!recursos) return 1;
    return Math.max(1, Math.ceil(recursos.length / this.ITEMS_PER_PAGE));
  }

  getTheme(index: number = 0): 'cerulean' | 'punch-red' {
    return index % 2 === 0 ? 'cerulean' : 'punch-red';
  }
}
