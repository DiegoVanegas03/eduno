import { Injectable, signal } from '@angular/core';

export interface ModalOptions {
  title: string;
  content?: string;
  changes?: Record<string, { old: any; new: any }>;
  isImageUpload?: boolean;
  onImageSelected?: (file: File) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  isOpen = signal(false);
  options = signal<ModalOptions | null>(null);

  open(options: ModalOptions) {
    this.options.set(options);
    this.isOpen.set(true);
    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.isOpen.set(false);
    document.body.classList.remove('overflow-hidden');
    // Don't immediately clear options to allow close animation if needed
    setTimeout(() => {
      if (!this.isOpen()) {
        this.options.set(null);
      }
    }, 300);
  }
}
