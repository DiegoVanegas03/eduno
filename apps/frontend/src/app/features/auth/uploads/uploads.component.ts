import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFilesService } from '@core/services/user-files/user-files.service';
import { ModalService } from '@shared/services/modal.service';
import { IFile } from '@eduno/shared';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-uploads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploads.component.html',
})
export class UploadsComponent implements OnInit {
  private userFilesService = inject(UserFilesService);
  private modalService = inject(ModalService);

  uploads = signal<IFile[]>([]);
  isLoading = signal(true);
  errorOccurred = signal(false);

  ngOnInit(): void {
    this.loadUploads();
  }

  loadUploads(): void {
    this.isLoading.set(true);
    this.errorOccurred.set(false);

    this.userFilesService.getMyUploads().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.uploads.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar aportes del alumno:', err);
        this.errorOccurred.set(true);
        this.isLoading.set(false);
        toast.error('No se pudieron cargar tus apuntes subidos.');
      },
    });
  }

  confirmDelete(file: IFile): void {
    this.modalService.open({
      title: 'Eliminar apunte aportado',
      content: `¿Estás seguro de que quieres eliminar el archivo "${file.originalName}"? Esta acción borrará el archivo de manera permanente y no podrá deshacerse.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        this.modalService.close();
        this.userFilesService.deleteUpload(file.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.uploads.update((list) => list.filter((f) => f.id !== file.id));
              toast.success('El apunte ha sido eliminado correctamente.');
            } else {
              toast.error(res.message || 'No se pudo eliminar el archivo.');
            }
          },
          error: (err) => {
            console.error('Error al eliminar archivo:', err);
            toast.error(err?.error?.error || 'Error al eliminar el archivo.');
          },
        });
      },
    });
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
