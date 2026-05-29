import { Component, computed, inject, signal, effect } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ReviewCard } from '@core/components/review-card/review-card';
import { MateriaAccordion } from '@core/components/materia-accordion/materia-accordion';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService, USER_ROLES } from '@app/core/services/auth/auth.service';
import { ProfesorService } from '@core/services/profesor/profesor.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs/operators';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { toast } from 'ngx-sonner';
import { IReview } from '@eduno/shared';
import { UserFilesService } from '@core/services/user-files/user-files.service';

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
    AvatarComponent,
  ],

  templateUrl: './profesor-perfil.component.html',
})
export class ProfesorPerfilComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  profesorService = inject(ProfesorService);
  userFilesService = inject(UserFilesService);

  constructor() {
    const editReviewId = this.route.snapshot.queryParamMap.get('editReviewId');
    const materiaId = this.route.snapshot.queryParamMap.get('materiaId');
    if (editReviewId && materiaId) {
      effect(
        () => {
          const p = this.profesor();
          if (p) {
            const currentUserId = this.authService.currentUser()?.id;
            const existing = p.resenas.find(
              (r) => r.id === editReviewId && r.userId === currentUserId,
            );
            if (existing) {
              const materia = p.materias.find(
                (m) => m.id.toString() === materiaId || m.clave === materiaId,
              );
              if (materia) {
                this.selectedMateria.set(materia.id.toString());
              } else {
                this.selectedMateria.set(materiaId && materiaId !== 'undefined' ? materiaId : '');
              }
              this.selectedRating.set(existing.rating);
              this.commentText.set(existing.comment);
              this.editingReviewId.set(existing.id);
              // Smoothly scroll down to the rating form
              setTimeout(() => {
                const el = document.getElementById('reviewFormContainer');
                if (el) {
                  const yOffset = -100; // Desplazar 100px más arriba
                  const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }, 200);
            }
          }
        },
        { allowSignalWrites: true },
      );
    }
  }

  private reloadTrigger = signal<number>(0);

  profesor = toSignal(
    toObservable(this.reloadTrigger).pipe(
      switchMap(() => {
        const id = this.route.snapshot.paramMap.get('id') || '';
        return this.profesorService.getProfesorById(id).pipe(map((res) => res.data));
      }),
    ),
  );

  expandedMateriaId = signal<string | null>(null);

  initialLetter = computed(() => this.authService.currentUser()?.initialLetter);
  isAuthenticated = computed(() => this.authService.isLoggedIn());
  isAlumno = computed(() => this.authService.hasRole(USER_ROLES.ALUMNO));

  viewMode = signal<'active' | 'history'>('active');

  // Formulario de opiniones
  selectedRating = signal<number>(0);
  hoveredRating = signal<number>(0);
  commentText = signal<string>('');
  selectedMateria = signal<string>('');
  isSubmitting = signal<boolean>(false);
  editingReviewId = signal<string | null>(null);

  // Modal de Reportes (reutilizado para Opiniones y Archivos)
  isReportModalOpen = signal<boolean>(false);
  reportTargetType = signal<'review' | 'file'>('review');
  reportedTargetId = signal<string | null>(null);
  reportReason = signal<string>('spam');
  reportDescription = signal<string>('');
  isSubmittingReport = signal<boolean>(false);

  // Modal y lógica de Carga de Archivos (Aportes)
  isUploadModalOpen = signal<boolean>(false);
  uploadMateriaId = signal<string>('');
  selectedFile = signal<File | null>(null);
  isUploading = signal<boolean>(false);

  studentReviews = computed(() => {
    const p = this.profesor();
    const currentUserId = this.authService.currentUser()?.id;
    if (!p || !currentUserId) return [];
    return p.resenas.filter((r) => r.userId === currentUserId);
  });

  hasReviewedAllMaterias = computed(() => {
    const p = this.profesor();
    if (!p) return false;
    const reviewedMateriaIds = this.studentReviews().map((r) => r.materiaId);
    return p.materias.every((m) => reviewedMateriaIds.includes(m.id.toString()));
  });

  // Estados para paginación y ordenamiento por Materia ID
  // key: materiaId, value: page number o sort order ('asc' o 'desc')
  materiaPage = signal<Record<string, number>>({});
  materiaSortOrder = signal<Record<string, 'desc' | 'asc'>>({});
  readonly ITEMS_PER_PAGE = 3;

  toggleMateria(id: any) {
    this.expandedMateriaId.set(this.expandedMateriaId() === id ? null : id);
  }

  // Métodos de Helper para la Vista de Recursos
  getMateriaSortOrder(materiaId: any): 'desc' | 'asc' {
    return this.materiaSortOrder()[materiaId] || 'desc'; // Por defecto, más recientes primero
  }

  toggleMateriaSortOrder(materiaId: any) {
    const current = this.getMateriaSortOrder(materiaId);
    this.materiaSortOrder.update((orders) => ({
      ...orders,
      [materiaId]: current === 'desc' ? 'asc' : 'desc',
    }));
    // Reset page to 1 when sorting changes
    this.setMateriaPage(materiaId, 1);
  }

  getMateriaPage(materiaId: any): number {
    return this.materiaPage()[materiaId] || 1;
  }

  setMateriaPage(materiaId: any, page: number) {
    this.materiaPage.update((pages) => ({
      ...pages,
      [materiaId]: page,
    }));
  }

  getProcessedRecursos(materiaId: any, recursos: any[]) {
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

  getTheme(index: any = 0): 'cerulean' | 'punch-red' {
    const num = typeof index === 'number' ? index : index ? index.toString().charCodeAt(0) : 0;
    return num % 2 === 0 ? 'cerulean' : 'punch-red';
  }

  submitReview() {
    const p = this.profesor();
    if (!p) return;

    const rating = this.selectedRating();
    const comment = this.commentText().trim();
    const materiaId = this.selectedMateria();

    if (!materiaId) {
      toast.error('Por favor, selecciona una materia.');
      return;
    }
    if (rating === 0) {
      toast.error('Por favor, selecciona una calificación de estrellas.');
      return;
    }
    if (!comment) {
      toast.error('Por favor, escribe tu comentario antes de publicar.');
      return;
    }

    const materiaObj = p.materias.find((m) => m.id.toString() === materiaId);
    const finalMateriaId = materiaObj ? materiaObj.clave || materiaObj.id.toString() : materiaId;

    this.isSubmitting.set(true);

    const reviewId = this.editingReviewId();
    if (reviewId) {
      this.profesorService.updateReview(reviewId, rating, comment, finalMateriaId).subscribe({
        next: (res) => {
          toast.success(res.message || '¡Tu opinión ha sido actualizada exitosamente!');
          this.resetReviewForm();
          this.isSubmitting.set(false);
          this.reloadTrigger.update((n) => n + 1);
        },
        error: (err: unknown) => {
          const errorObj = err as { error?: { error?: string; message?: string } };
          const errorMsg =
            errorObj.error?.error || errorObj.error?.message || 'Error al actualizar tu opinión.';
          toast.error(errorMsg);
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.profesorService
        .createReview(p.id.toString(), rating, comment, finalMateriaId)
        .subscribe({
          next: (res) => {
            toast.success(res.message || '¡Tu opinión ha sido publicada exitosamente!');
            this.resetReviewForm();
            this.isSubmitting.set(false);
            this.reloadTrigger.update((n) => n + 1);
          },
          error: (err: unknown) => {
            const errorObj = err as { error?: { error?: string; message?: string } };
            const errorMsg =
              errorObj.error?.error || errorObj.error?.message || 'Error al publicar tu opinión.';
            toast.error(errorMsg);
            this.isSubmitting.set(false);
          },
        });
    }
  }

  onMateriaChange(materiaId: string) {
    this.selectedMateria.set(materiaId);

    const p = this.profesor();
    if (!p) return;
    const materia = p.materias.find((m) => m.id.toString() === materiaId);
    if (!materia) {
      this.resetReviewForm();
      return;
    }

    const currentUserId = this.authService.currentUser()?.id;
    const existing = p.resenas.find(
      (r) =>
        r.userId === currentUserId &&
        (r.materiaId === materia.id.toString() || r.materiaId === materia.clave),
    );

    if (existing) {
      this.selectedRating.set(existing.rating);
      this.commentText.set(existing.comment);
      this.editingReviewId.set(existing.id);
    } else {
      this.selectedRating.set(0);
      this.commentText.set('');
      this.editingReviewId.set(null);
    }
  }

  resetReviewForm() {
    this.selectedRating.set(0);
    this.commentText.set('');
    this.selectedMateria.set('');
    this.editingReviewId.set(null);
  }

  editReviewFromCard(resena: IReview) {
    const p = this.profesor();
    if (!p) {
      return;
    }
    const materia = p.materias.find(
      (m) => m.id.toString() === resena.materiaId || m.clave === resena.materiaId,
    );

    if (materia) {
      this.selectedMateria.set(materia.id.toString());
    } else {
      // Legacy review without materiaId, leave the dropdown blank so the user can select one
      this.selectedMateria.set('');
    }

    this.selectedRating.set(resena.rating);
    this.commentText.set(resena.comment);
    this.editingReviewId.set(resena.id);

    setTimeout(() => {
      const el = document.getElementById('reviewFormContainer');
      if (el) {
        const yOffset = -100; // Desplazar 100px más arriba
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 50);
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

  openReportModal(targetId: string, targetType: 'review' | 'file' = 'review') {
    if (!this.isAuthenticated()) {
      toast.error(targetType === 'file' ? 'Debes iniciar sesión para reportar un archivo.' : 'Debes iniciar sesión para reportar una opinión.');
      return;
    }
    this.reportTargetType.set(targetType);
    this.reportedTargetId.set(targetId);
    this.reportReason.set('spam');
    this.reportDescription.set('');
    this.isReportModalOpen.set(true);
  }

  closeReportModal() {
    this.isReportModalOpen.set(false);
    this.reportedTargetId.set(null);
    this.reportReason.set('spam');
    this.reportDescription.set('');
  }

  submitReport() {
    const targetId = this.reportedTargetId();
    const targetType = this.reportTargetType();
    const reason = this.reportReason();
    const description = this.reportDescription().trim();

    if (!targetId) return;
    if (!description) {
      toast.error('Por favor, escribe una breve descripción para tu reporte.');
      return;
    }

    this.isSubmittingReport.set(true);

    if (targetType === 'file') {
      this.userFilesService.reportFile(targetId, reason, description).subscribe({
        next: (res: any) => {
          toast.success(res.message || 'El reporte del archivo ha sido enviado exitosamente.');
          this.closeReportModal();
          this.isSubmittingReport.set(false);
        },
        error: (err: any) => {
          const errorMsg = err?.error?.error || err?.error?.message || 'Error al enviar el reporte.';
          toast.error(errorMsg);
          this.isSubmittingReport.set(false);
        },
      });
    } else {
      this.profesorService.reportReview(targetId, reason, description).subscribe({
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

  // ─── File Upload (Aportes) Methods ─────────────────────────────────────────
  openUploadModal(materiaId: string | number) {
    if (!this.isAuthenticated()) {
      toast.error('Debes iniciar sesión para aportar un apunte.');
      return;
    }
    if (!this.isAlumno()) {
      toast.error('Únicamente los alumnos pueden aportar apuntes.');
      return;
    }
    this.uploadMateriaId.set(materiaId.toString());
    this.selectedFile.set(null);
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.uploadMateriaId.set('');
    this.selectedFile.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      // Validate max size 20MB
      if (file.size > 20 * 1024 * 1024) {
        toast.error('El archivo excede el tamaño máximo permitido de 20MB.');
        return;
      }
      // Validate allowed mime types (PDF, Word, Images)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato de archivo no permitido. Solo se permiten PDFs, documentos Word e imágenes.');
        return;
      }
      this.selectedFile.set(file);
      toast.success(`Archivo "${file.name}" seleccionado.`);
    }
  }

  submitUpload() {
    const materiaId = this.uploadMateriaId();
    const file = this.selectedFile();

    if (!materiaId || !file) {
      toast.error('Por favor, selecciona un archivo válido para subir.');
      return;
    }

    this.isUploading.set(true);
    this.userFilesService.uploadFile(materiaId, file).subscribe({
      next: (res) => {
        if (res.success) {
          toast.success('¡Archivo aportado exitosamente! Pasará por el proceso de moderación.');
          this.closeUploadModal();
          this.reloadTrigger.update((n) => n + 1);
        } else {
          toast.error(res.message || 'No se pudo subir el archivo.');
        }
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Error al subir apunte:', err);
        const errorMsg = err?.error?.error || err?.error?.message || 'Error al aportar el apunte. Revisa que el antivirus no lo haya detectado como infectado.';
        toast.error(errorMsg);
        this.isUploading.set(false);
      },
    });
  }

  // ─── File Download Method ──────────────────────────────────────────────────
  downloadFile(recursoId: string, filename: string) {
    if (!this.isAuthenticated()) {
      toast.error('Debes iniciar sesión para descargar este apunte.');
      return;
    }

    toast.promise(
      new Promise<void>((resolve, reject) => {
        this.userFilesService.downloadFile(recursoId).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            resolve();
          },
          error: (err: any) => {
            console.error('Error de descarga:', err);
            reject(err);
          }
        });
      }),
      {
        loading: 'Iniciando descarga y validando cuotas...',
        success: '¡Archivo descargado exitosamente!',
        error: (err: any) => {
          return err?.error?.error || 'Límite de descargas superado. Aporta apuntes aprobados para ganar más cuotas de descarga.';
        }
      }
    );
  }
}
