import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfessorAdminService } from '@core/services/professor-admin/professor-admin.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { IProfessor, ISchedule } from '@eduno/shared';

@Component({
  selector: 'app-manage-professors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manage-professors.component.html',
})
export class ManageProfessorsComponent implements OnInit {
  private professorAdminService = inject(ProfessorAdminService);

  // Active View Tab: 'professors' | 'requests'
  activeTab = signal<'professors' | 'requests'>('professors');

  // ───────────────────────────────────────────────────────────────────────────
  // PROFESSORS MANAGEMENT STATE
  // ───────────────────────────────────────────────────────────────────────────
  professorsList = signal<IProfessor[]>([]);
  isLoadingProfessors = signal(true);
  searchProfessorQuery = signal('');

  // Professors Pagination
  profCurrentPage = signal(1);
  profItemsPerPage = signal(10);
  profTotalItems = signal(0);
  profTotalPages = signal(0);

  // Professors Modals Visibility
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);
  selectedProfessor = signal<IProfessor | null>(null);

  // Form Fields
  formName = '';
  formEmail = '';
  formCalificacion = 5.0;
  formDescAbreviada = '';
  formDescPerfil = '';

  // ───────────────────────────────────────────────────────────────────────────
  // VERIFICATION REQUESTS STATE
  // ───────────────────────────────────────────────────────────────────────────
  requestsList = signal<any[]>([]);
  isLoadingRequests = signal(true);
  requestStatusFilter = signal<'pending' | 'approved' | 'rejected'>('pending');

  // Requests Pagination
  reqCurrentPage = signal(1);
  reqItemsPerPage = signal(10);
  reqTotalItems = signal(0);
  reqTotalPages = signal(0);

  // Document modal preview
  isPreviewModalOpen = signal(false);
  previewDocumentUrl = signal('');
  previewProfessorName = signal('');
  previewStudentName = signal('');

  // Process Modal Visibility
  isProcessModalOpen = signal(false);
  selectedRequestForAction = signal<any | null>(null);
  actionNotes = '';

  // ───────────────────────────────────────────────────────────────────────────
  // COMPUTED SLIDING WINDOW PAGINATION
  // ───────────────────────────────────────────────────────────────────────────
  profPaginationItems = computed<(number | string)[]>(() => {
    const total = this.profTotalPages();
    const current = this.profCurrentPage();
    if (total <= 5) {
      const pages = [];
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    const items: (number | string)[] = [];
    if (current <= 3) {
      items.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      items.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      items.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return items;
  });

  reqPaginationItems = computed<(number | string)[]>(() => {
    const total = this.reqTotalPages();
    const current = this.reqCurrentPage();
    if (total <= 5) {
      const pages = [];
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    const items: (number | string)[] = [];
    if (current <= 3) {
      items.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      items.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      items.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return items;
  });

  ngOnInit() {
    this.loadProfessors();
    this.loadVerificationRequests();
  }

  changeTab(tab: 'professors' | 'requests') {
    this.activeTab.set(tab);
    if (tab === 'professors') {
      this.loadProfessors();
    } else {
      this.loadVerificationRequests();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROFESSORS MANAGEMENT OPERATIONS
  // ───────────────────────────────────────────────────────────────────────────
  loadProfessors() {
    this.isLoadingProfessors.set(true);
    this.professorAdminService
      .getProfessors({
        search: this.searchProfessorQuery().trim(),
        page: this.profCurrentPage(),
        limit: this.profItemsPerPage(),
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.professorsList.set(res.data);
            if (res.pagination) {
              this.profTotalItems.set(res.pagination.totalItems);
              this.profTotalPages.set(res.pagination.totalPages);
            }
          }
          this.isLoadingProfessors.set(false);
        },
        error: (err: any) => {
          console.error(err);
          toast.error('Error al obtener lista de profesores.');
          this.isLoadingProfessors.set(false);
        },
      });
  }

  triggerSearch() {
    this.profCurrentPage.set(1);
    this.loadProfessors();
  }

  openCreateModal() {
    this.formName = '';
    this.formEmail = '';
    this.formCalificacion = 5.0;
    this.formDescAbreviada = '';
    this.formDescPerfil = '';
    this.isCreateModalOpen.set(true);
  }

  createProfessor() {
    if (!this.formName.trim()) {
      toast.error('El nombre del profesor es obligatorio.');
      return;
    }

    const payload = {
      name: this.formName.trim(),
      email: this.formEmail.trim() || undefined,
      calificacion: Number(this.formCalificacion),
      descripcionAbreviada: this.formDescAbreviada.trim() || undefined,
      descripcionPerfil: this.formDescPerfil.trim() || undefined,
    };

    toast.promise(firstValueFrom(this.professorAdminService.createProfessor(payload)), {
      loading: 'Guardando perfil de profesor...',
      success: (res) => {
        this.loadProfessors();
        this.isCreateModalOpen.set(false);
        return 'Profesor registrado con éxito.';
      },
      error: (err: any) => err.error?.error || 'No se pudo crear el profesor.',
    });
  }

  openEditModal(prof: IProfessor) {
    this.selectedProfessor.set(prof);
    this.formName = prof.name;
    this.formEmail = prof.email || '';
    this.formCalificacion = prof.calificacion || 5.0;
    this.formDescAbreviada = prof.descripcionAbreviada || '';
    this.formDescPerfil = prof.descripcionPerfil || '';
    this.isEditModalOpen.set(true);
  }

  saveProfessorEdit() {
    const currentId = this.selectedProfessor()?.id;
    if (!currentId) return;

    if (!this.formName.trim()) {
      toast.error('El nombre del profesor es obligatorio.');
      return;
    }

    const payload = {
      name: this.formName.trim(),
      email: this.formEmail.trim() || undefined,
      calificacion: Number(this.formCalificacion),
      descripcionAbreviada: this.formDescAbreviada.trim() || undefined,
      descripcionPerfil: this.formDescPerfil.trim() || undefined,
    };

    toast.promise(firstValueFrom(this.professorAdminService.updateProfessor(currentId, payload)), {
      loading: 'Actualizando perfil de profesor...',
      success: () => {
        this.loadProfessors();
        this.isEditModalOpen.set(false);
        return 'Perfil actualizado con éxito.';
      },
      error: (err: any) => err.error?.error || 'No se pudo actualizar el perfil.',
    });
  }

  deleteProfessor(prof: IProfessor) {
    if (!prof.id) return;
    toast.promise(firstValueFrom(this.professorAdminService.deleteProfessor(prof.id)), {
      loading: 'Eliminando profesor de la base de datos...',
      success: () => {
        this.loadProfessors();
        return 'Profesor eliminado exitosamente.';
      },
      error: (err: any) => err.error?.error || 'Error al eliminar profesor.',
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VERIFICATION REQUESTS OPERATIONS
  // ───────────────────────────────────────────────────────────────────────────
  loadVerificationRequests() {
    this.isLoadingRequests.set(true);
    this.professorAdminService
      .listVerificationRequests({
        status: this.requestStatusFilter(),
        page: this.reqCurrentPage(),
        limit: this.reqItemsPerPage(),
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.requestsList.set(res.data);
            if (res.pagination) {
              this.reqTotalItems.set(res.pagination.totalItems);
              this.reqTotalPages.set(res.pagination.totalPages);
            }
          }
          this.isLoadingRequests.set(false);
        },
        error: (err: any) => {
          console.error(err);
          toast.error('Error al cargar solicitudes de verificación.');
          this.isLoadingRequests.set(false);
        },
      });
  }

  changeStatusFilter(status: 'pending' | 'approved' | 'rejected') {
    this.requestStatusFilter.set(status);
    this.reqCurrentPage.set(1);
    this.loadVerificationRequests();
  }

  openPreviewModal(req: any) {
    this.previewDocumentUrl.set(req.documentUrl);
    this.previewProfessorName.set(req.professorName);
    this.previewStudentName.set(req.userName);
    this.isPreviewModalOpen.set(true);
  }

  openProcessModal(req: any) {
    this.selectedRequestForAction.set(req);
    this.actionNotes = '';
    this.isProcessModalOpen.set(true);
  }

  submitProcessRequest(status: 'approved' | 'rejected') {
    const currentReq = this.selectedRequestForAction();
    if (!currentReq) return;

    const payload = {
      status,
      notes: this.actionNotes.trim() || undefined,
    };

    toast.promise(firstValueFrom(this.professorAdminService.processVerificationRequest(currentReq.id, payload)), {
      loading: status === 'approved' ? 'Aprobando solicitud y elevando rol docente...' : 'Rechazando solicitud...',
      success: () => {
        this.loadVerificationRequests();
        this.isProcessModalOpen.set(false);
        return status === 'approved' ? 'Solicitud aprobada correctamente.' : 'Solicitud rechazada correctamente.';
      },
      error: (err: any) => err.error?.error || 'Error al procesar la solicitud.',
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GENERAL PAGINATION HELPERS
  // ───────────────────────────────────────────────────────────────────────────
  profGoToPage(page: number | string) {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.profTotalPages()) {
      this.profCurrentPage.set(pageNum);
      this.loadProfessors();
    }
  }

  profNextPage() {
    if (this.profCurrentPage() < this.profTotalPages()) {
      this.profCurrentPage.set(this.profCurrentPage() + 1);
      this.loadProfessors();
    }
  }

  profPrevPage() {
    if (this.profCurrentPage() > 1) {
      this.profCurrentPage.set(this.profCurrentPage() - 1);
      this.loadProfessors();
    }
  }

  reqGoToPage(page: number | string) {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.reqTotalPages()) {
      this.reqCurrentPage.set(pageNum);
      this.loadVerificationRequests();
    }
  }

  reqNextPage() {
    if (this.reqCurrentPage() < this.reqTotalPages()) {
      this.reqCurrentPage.set(this.reqCurrentPage() + 1);
      this.loadVerificationRequests();
    }
  }

  reqPrevPage() {
    if (this.reqCurrentPage() > 1) {
      this.reqCurrentPage.set(this.reqCurrentPage() - 1);
      this.loadVerificationRequests();
    }
  }
}
