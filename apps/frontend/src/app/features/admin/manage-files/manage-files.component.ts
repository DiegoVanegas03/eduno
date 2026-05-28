import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFilesService } from '@core/services/user-files/user-files.service';
import { IFile } from '@eduno/shared';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-manage-files',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-files.component.html',
})
export class ManageFilesComponent implements OnInit {
  private userFilesService = inject(UserFilesService);

  pendingFiles = signal<IFile[]>([]);
  isLoading = signal(true);
  errorOccurred = signal(false);

  ngOnInit(): void {
    this.loadPendingFiles();
  }

  loadPendingFiles(): void {
    this.isLoading.set(true);
    this.errorOccurred.set(false);

    this.userFilesService.getPendingFiles().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingFiles.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar apuntes pendientes:', err);
        this.errorOccurred.set(true);
        this.isLoading.set(false);
        toast.error('No se pudieron cargar los apuntes pendientes de moderación.');
      },
    });
  }

  moderate(file: IFile, status: 'approved' | 'rejected'): void {
    const actionText = status === 'approved' ? 'aprobar' : 'rechazar';
    
    toast.promise(
      new Promise<void>((resolve, reject) => {
        this.userFilesService.moderateFile(file.id, status).subscribe({
          next: (res) => {
            if (res.success) {
              this.pendingFiles.update((list) => list.filter((f) => f.id !== file.id));
              resolve();
            } else {
              reject(new Error(res.message || 'Error al moderar el archivo.'));
            }
          },
          error: (err: any) => {
            console.error('Error al moderar archivo:', err);
            reject(err);
          },
        });
      }),
      {
        loading: `Procesando decisión de ${actionText} para "${file.originalName}"...`,
        success: `El apunte ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente.`,
        error: (err: any) => err.message || `No se pudo registrar la moderación de ${actionText}.`,
      }
    );
  }

  previewFile(file: IFile): void {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        this.userFilesService.downloadFile(file.id).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            resolve();
          },
          error: (err: any) => reject(err),
        });
      }),
      {
        loading: 'Descargando copia del archivo para vista previa...',
        success: '¡Archivo descargado para revisión exitosamente!',
        error: 'No se pudo descargar el archivo para vista previa.',
      }
    );
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
