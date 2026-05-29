import { Component, computed, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReviewCard } from '@core/components/review-card/review-card';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { AuthService, USER_ROLES } from '@app/core/services/auth/auth.service';
import { switchMap, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '@shared/components/breadcrumb/breadcrumb.component';
import { toast } from 'ngx-sonner';
import { ButtonComponent } from '@shared/components/button/button.component';
import { IReview } from '@eduno/shared';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profesor-opiniones',
  standalone: true,
  imports: [RouterLink, ReviewCard, FormsModule, BreadcrumbComponent, CommonModule, ButtonComponent],
  templateUrl: './profesor-opiniones.component.html',
})
export class ProfesorOpinionesComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  profesorService = inject(ProfesorService);
  authService = inject(AuthService);

  private reloadTrigger = signal<number>(0);

  profesor = toSignal(
    toObservable(this.reloadTrigger).pipe(
      switchMap(() => {
        const id = this.route.snapshot.paramMap.get('id') || '';
        return this.profesorService.getProfesorById(id).pipe(
          map((res) => res.data)
        );
      }),
    ),
  );

  // Filtros
  selectedMateria = signal<string>('todas');
  selectedRating = signal<string>('todos');
  sortOrder = signal<string>('recientes'); // recientes, alta, baja

  isAuthenticated = computed(() => this.authService.isLoggedIn());

  // Modal de Reportes
  isReportModalOpen = signal<boolean>(false);
  reportedReviewId = signal<string | null>(null);
  reportReason = signal<string>('spam');
  reportDescription = signal<string>('');
  isSubmittingReport = signal<boolean>(false);

  // Reseñas filtradas y ordenadas
  filteredResenas = computed(() => {
    const prof = this.profesor();
    if (!prof) return [];

    let resenas = [...prof.resenas];

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
        default: {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
      }
    });

    return resenas;
  });

  getTheme(index: number = 0): 'cerulean' | 'punch-red' {
    return index % 2 === 0 ? 'cerulean' : 'punch-red';
  }

  isOwnReview(reviewUserId?: string): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    return !!(currentUserId && reviewUserId && currentUserId === reviewUserId);
  }

  isReviewEdited(createdAt?: Date | string, updatedAt?: Date | string): boolean {
    if (!createdAt || !updatedAt) return false;
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    return Math.abs(updated - created) > 1000;
  }

  hasLikedReview(likes?: string[]): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    return !!(currentUserId && likes && likes.includes(currentUserId));
  }

  hasDislikedReview(dislikes?: string[]): boolean {
    const currentUserId = this.authService.currentUser()?.id;
    return !!(currentUserId && dislikes && dislikes.includes(currentUserId));
  }

  likeReview(reviewId: string) {
    if (!this.isAuthenticated()) {
      toast.error('Debes iniciar sesión para dar me gusta.');
      return;
    }
    this.profesorService.likeReview(reviewId).subscribe({
      next: () => {
        this.reloadTrigger.update((n) => n + 1);
      },
      error: () => {
        toast.error('Error al reaccionar a la opinión.');
      },
    });
  }

  dislikeReview(reviewId: string) {
    if (!this.isAuthenticated()) {
      toast.error('Debes iniciar sesión para dar no me gusta.');
      return;
    }
    this.profesorService.dislikeReview(reviewId).subscribe({
      next: () => {
        this.reloadTrigger.update((n) => n + 1);
      },
      error: () => {
        toast.error('Error al reaccionar a la opinión.');
      },
    });
  }

  deleteReview(reviewId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar tu opinión?')) {
      return;
    }
    this.profesorService.deleteReview(reviewId).subscribe({
      next: (res) => {
        toast.success(res.message || 'Tu opinión ha sido eliminada.');
        this.reloadTrigger.update((n) => n + 1);
      },
      error: () => {
        toast.error('Error al eliminar la opinión.');
      },
    });
  }

  editReviewFromCard(resena: IReview) {
    const prof = this.profesor();
    if (!prof) {
      return;
    }
    const queryParams: any = { editReviewId: resena.id };
    if (resena.materiaId) {
      queryParams.materiaId = resena.materiaId;
    }
    this.router.navigate(['/profesores', prof.id], { queryParams });
  }

  openReportModal(reviewId: string) {
    if (!this.isAuthenticated()) {
      toast.error('Debes iniciar sesión para reportar una opinión.');
      return;
    }
    this.reportedReviewId.set(reviewId);
    this.reportReason.set('spam');
    this.reportDescription.set('');
    this.isReportModalOpen.set(true);
  }

  closeReportModal() {
    this.isReportModalOpen.set(false);
    this.reportedReviewId.set(null);
    this.reportReason.set('spam');
    this.reportDescription.set('');
  }

  submitReport() {
    const reviewId = this.reportedReviewId();
    const reason = this.reportReason();
    const description = this.reportDescription().trim();

    if (!reviewId) return;
    if (!description) {
      toast.error('Por favor, escribe una breve descripción para tu reporte.');
      return;
    }

    this.isSubmittingReport.set(true);
    this.profesorService.reportReview(reviewId, reason, description).subscribe({
      next: (res: any) => {
        toast.success(res.message || 'El reporte ha sido enviado exitosamente.');
        this.closeReportModal();
        this.isSubmittingReport.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Error al enviar el reporte.';
        toast.error(errorMsg);
        this.isSubmittingReport.set(false);
      },
    });
  }
}
