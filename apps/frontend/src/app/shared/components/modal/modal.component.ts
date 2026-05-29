import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';
import { ModalService } from '../../services/modal.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './modal.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #e5e7eb;
      border-radius: 20px;
    }
  `]
})
export class ModalComponent {
  private modalService = inject(ModalService);
  
  isOpen = this.modalService.isOpen;
  options = this.modalService.options;
  isDragging = signal(false);

  getChanges() {
    const changes = this.options()?.changes;
    if (!changes) return [];
    return Object.keys(changes).map(key => ({
      key,
      old: changes[key].old,
      new: changes[key].new
    }));
  }

  close() {
    this.modalService.close();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const onImageSelected = this.options()?.onImageSelected;
      if (onImageSelected) {
        onImageSelected(file);
      }
      this.close();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const onImageSelected = this.options()?.onImageSelected;
        if (onImageSelected) {
          onImageSelected(file);
        }
        this.close();
      } else {
        toast.error('Por favor, selecciona un archivo de imagen válido.');
      }
    }
  }

  confirm() {
    const onConfirm = this.options()?.onConfirm;
    if (onConfirm) {
      onConfirm();
    } else {
      this.close();
    }
  }

  cancel() {
    const onCancel = this.options()?.onCancel;
    if (onCancel) {
      onCancel();
    } else {
      this.close();
    }
  }
}
