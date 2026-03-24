import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div
      class="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-white via-cerulean-50 to-frosted-blue-100 relative overflow-hidden"
    >
      <!-- Background Decorative Elements -->
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cerulean-200/20 blur-[120px] rounded-full"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-punch-red-100/20 blur-[120px] rounded-full"
      ></div>

      <div
        class="max-w-2xl w-full text-center z-10 space-y-8 animate-in fade-in zoom-in duration-700"
      >
        <div class="space-y-4">
          <h1 class="text-4xl md:text-6xl font-extrabold text-oxford-navy-900 tracking-tight">
            Próximamente
          </h1>
          <p class="text-lg md:text-xl text-oxford-navy-600 max-w-lg mx-auto leading-relaxed">
            Estamos trabajando duro para traerte esta nueva funcionalidad. ¡Vuelve pronto para
            descubrir lo que estamos preparando para ti!
          </p>
        </div>

        <!-- Progress Indicator -->
        <div class="max-w-xs mx-auto space-y-2">
          <div class="h-2 w-full bg-cerulean-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-cerulean-500 rounded-full w-[65%] animate-[loading_2s_ease-in-out_infinite]"
            ></div>
          </div>
          <span class="text-xs font-bold text-cerulean-600 uppercase tracking-widest"
            >En construcción</span
          >
        </div>

        <app-button class="mt-8" variant="secondary" routerLink="/" size="lg">
          Regresar al Inicio
        </app-button>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes loading {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(200%);
        }
      }
    `,
  ],
})
export class ComingSoonComponent {}
