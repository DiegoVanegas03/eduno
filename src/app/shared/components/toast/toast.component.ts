import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toastService.toasts().length > 0) {
      <div
        class="fixed top-6 right-6 z-9999 flex flex-col items-end pointer-events-none group/toast-container"
        (mouseenter)="isHovered.set(true)"
        (mouseleave)="isHovered.set(false)"
      >
        <div class="relative w-[380px]">
          @for (toast of toastService.toasts(); track toast.id; let i = $index; let count = $count) {
            <div
              class="absolute top-0 right-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto"
              [ngStyle]="getToastStyle(i, count)"
            >
              <div
                class="flex p-4 rounded-2xl border bg-white shadow-xl overflow-hidden relative"
                [ngClass]="{
                  'border-honeydew-200': toast.type === 'success',
                  'border-punch-red-200': toast.type === 'error',
                  'border-cerulean-200': toast.type === 'info',
                  'border-orange-200': toast.type === 'warning'
                }"
              >
                <!-- Indicator line -->
                <div
                  class="absolute left-0 top-0 bottom-0 w-1.5"
                  [ngClass]="{
                    'bg-honeydew-500': toast.type === 'success',
                    'bg-punch-red-500': toast.type === 'error',
                    'bg-cerulean-500': toast.type === 'info',
                    'bg-orange-500': toast.type === 'warning'
                  }"
                ></div>

                <!-- Content wrapper -->
                <div class="flex items-start gap-4 w-full pl-2">
                  <!-- Icon container -->
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    [ngClass]="{
                      'bg-honeydew-100 text-honeydew-600': toast.type === 'success',
                      'bg-punch-red-100 text-punch-red-600': toast.type === 'error',
                      'bg-cerulean-100 text-cerulean-600': toast.type === 'info',
                      'bg-orange-100 text-orange-600': toast.type === 'warning'
                    }"
                  >
                    @if (toast.type === 'success') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    } @else if (toast.type === 'error') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    } @else if (toast.type === 'info') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                      </svg>
                    }
                  </div>

                  <!-- Text content -->
                  <div class="flex-1 min-w-0 pr-6">
                    <h4 class="font-bold text-oxford-navy-900 leading-tight mb-0.5">
                      {{ toast.title }}
                    </h4>
                    <div class="text-sm text-oxford-navy-500 leading-snug">
                      <span [class.line-clamp-2]="!isHovered()">{{ toast.message }}</span>
                      @if (toast.action) {
                        <button
                          (click)="
                            toast.action.onClick();
                            toastService.remove(toast.id);
                            $event.stopPropagation()
                          "
                          class="ml-1 text-cerulean-600 hover:text-cerulean-700 font-bold underline decoration-cerulean-200 hover:decoration-cerulean-600 transition-all cursor-pointer inline-block"
                        >
                          {{ toast.action.label }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Close button -->
                  <button
                    (click)="toastService.remove(toast.id); $event.stopPropagation()"
                    class="absolute top-4 right-4 p-1 rounded-full text-oxford-navy-400 hover:text-punch-red-500 hover:bg-punch-red-50 transition-all duration-200 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      class="w-4 h-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ToastComponent {
  protected toastService = inject(ToastService);
  isHovered = signal(false);

  /**
   * Calculates the style for each toast based on its index and whether the stack is hovered.
   * Toasts are rendered from first to last in the array.
   * i=0 is the oldest (front/bottom in collapsed), count-1 is the newest (back/top in collapsed).
   * We want the NEWEST to be visible on top.
   */
  getToastStyle(index: number, count: number) {
    const isHovered = this.isHovered();
    const reverseIndex = count - 1 - index; // 0 for the newest, count-1 for the oldest

    // Collapsed state logic
    if (!isHovered) {
      // Only show up to 3 toasts in stack
      if (reverseIndex >= 3) {
        return {
          opacity: '0',
          transform: `translateY(-20px) scale(0.8)`,
          'z-index': '0',
        };
      }

      const yOffset = reverseIndex * 12; // 0, 12, 24
      const scale = 1 - reverseIndex * 0.05; // 1, 0.95, 0.9
      const opacity = 1 - reverseIndex * 0.1; // 1, 0.9, 0.8

      return {
        transform: `translateY(${yOffset}px) scale(${scale})`,
        opacity: `${opacity}`,
        'z-index': `${100 - reverseIndex}`,
        'box-shadow':
          reverseIndex > 0
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      };
    }

    // Expanded state logic
    // We spread them out vertically. reverseIndex 0 (newest) is at the top.
    const gap = 110; // Height of toast + margin
    const yOffset = reverseIndex * gap;

    return {
      transform: `translateY(${yOffset}px) scale(1)`,
      opacity: '1',
      'z-index': `${100 - reverseIndex}`,
    };
  }
}
