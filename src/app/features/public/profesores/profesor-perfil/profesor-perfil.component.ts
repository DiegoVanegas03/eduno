import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ReviewCard } from '../../../../core/components/review-card/review-card';
import { MateriaAccordion } from '../../../../core/components/materia-accordion/materia-accordion';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-profesor-perfil',
  standalone: true,
  imports: [RouterLink, ReviewCard, MateriaAccordion, ButtonComponent],
  templateUrl: './profesor-perfil.component.html',
})
export class ProfesorPerfilComponent {
  authService = inject(AuthService);
  router = inject(Router);
  expandedMateriaId = signal<number | null>(1);
  isAuthenticated = computed(() => this.authService.isLoggedIn);

  toggleMateria(id: number) {
    this.expandedMateriaId.set(this.expandedMateriaId() === id ? null : id);
  }
}
