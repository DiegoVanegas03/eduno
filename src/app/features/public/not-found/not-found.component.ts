import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-white via-punch-red-50 to-cerulean-50 relative overflow-hidden">
      <!-- Background Decorative Elements -->
      <div class="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-punch-red-200/20 blur-[100px] rounded-full"></div>
      <div class="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-oxford-navy-200/20 blur-[100px] rounded-full"></div>
      
      <div class="max-w-4xl w-full text-center z-10 animate-in fade-in slide-in-from-bottom duration-700">
        <!-- Error Number -->
        <div class="relative inline-block mb-12">
          <h1 class="text-[12rem] md:text-[18rem] font-extrabold text-oxford-navy-900 leading-none tracking-tighter mix-blend-multiply opacity-10">
            404
          </h1>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
            <h2 class="text-4xl md:text-6xl font-extrabold text-punch-red-600 tracking-tight">
              Oops! Página extraviada
            </h2>
          </div>
        </div>

        <div class="space-y-6 max-w-2xl mx-auto">
          <p class="text-lg md:text-xl text-oxford-navy-600 leading-relaxed font-medium">
            No pudimos encontrar la ruta que buscabas. Quizás se movió a otro lugar o el enlace es incorrecto.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <app-button variant="primary" routerLink="/" size="lg" class="w-full sm:w-auto">
              Volver al Inicio
            </app-button>
            <app-button variant="secondary" (click)="goBack()" size="lg" class="w-full sm:w-auto">
              Regresar Atrás
            </app-button>
          </div>
        </div>

        <!-- Illustration-like elements -->
        <div class="mt-12 flex justify-center gap-12 text-oxford-navy-200 opacity-40">
           <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
           <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zm-5 6a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1zm10 0a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1z"></path></svg>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  goBack() {
    window.history.back();
  }
}
