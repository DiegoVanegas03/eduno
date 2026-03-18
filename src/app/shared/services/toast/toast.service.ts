import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    
    this._toasts.update(toasts => [...toasts, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration || 5000);
    }
  }

  success(message: string, title: string = '¡Éxito!', action?: Toast['action']) {
    this.show({ type: 'success', title, message, action });
  }

  error(message: string, title: string = 'Error', action?: Toast['action']) {
    this.show({ type: 'error', title, message, action });
  }

  info(message: string, title: string = 'Información', action?: Toast['action']) {
    this.show({ type: 'info', title, message, action });
  }

  warning(message: string, title: string = 'Advertencia', action?: Toast['action']) {
    this.show({ type: 'warning', title, message, action });
  }

  remove(id: string) {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
