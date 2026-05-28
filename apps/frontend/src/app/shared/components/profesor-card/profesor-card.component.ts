import { Component, Input } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Profesor } from '@core/models/profesor.model';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-profesor-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, TitleCasePipe],
  template: `
    <div
      [ngClass]="{
        'bg-linear-to-br from-white to-amber-50/20 border-amber-200/50 hover:shadow-amber-100/50':
          isDestacado,
        'bg-white border-cerulean-150': !isDestacado,
      }"
      class="rounded-3xl p-6 shadow-xs border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
    >
      <div>
        <!-- Card Header -->
        <div class="flex items-start justify-between mb-4 gap-4">
          <div class="flex items-center gap-4 min-w-0">
            <app-avatar
              [name]="profesor.nombre"
              [theme]="isDestacado ? 'amber' : theme"
              size="lg"
            />
            <div class="min-w-0">
              <h3
                class="font-extrabold text-oxford-navy-900 text-base md:text-lg truncate group-hover:text-cerulean-600 transition-colors"
                [title]="profesor.nombre"
              >
                {{ profesor.nombre | titlecase }}
              </h3>
              <p
                class="text-xs font-semibold uppercase tracking-wider"
                [ngClass]="{
                  'text-amber-600': isDestacado,
                  'text-oxford-navy-400': !isDestacado,
                }"
              >
                {{ isDestacado ? 'Recomendado' : 'Docente' }}
              </p>
            </div>
          </div>

          <!-- Stars Badge -->
          <div
            [ngClass]="{
              'bg-amber-100 text-amber-800': isDestacado,
              'bg-punch-red-100 text-honeydew-900': !isDestacado,
            }"
            class="font-black px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 shrink-0"
          >
            <span>{{ profesor.calificacion }}</span>
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </div>

        <!-- Description/Quote -->
        <p
          class="text-oxford-navy-600 text-xs md:text-sm mb-6 line-clamp-3 italic leading-relaxed min-h-[50px]"
        >
          "{{ profesor.descripcionAbreviada || 'Sin reseñas destacadas todavía.' }}"
        </p>
      </div>

      <!-- Footer / Actions -->
      <div
        [ngClass]="{
          'border-amber-100/50': isDestacado,
          'border-cerulean-50': !isDestacado,
        }"
        class="flex justify-between items-center pt-4 border-t"
      >
        <span class="text-[11px] text-oxford-navy-450 font-bold">
          {{ profesor.numResenas }} reseña{{ profesor.numResenas !== 1 ? 's' : '' }}
        </span>
        <a
          [routerLink]="['/profesores', profesor.id]"
          [ngClass]="{
            'text-amber-600 hover:text-amber-700': isDestacado,
            'text-punch-red-500 hover:text-punch-red-600': !isDestacado,
          }"
          class=" text-xs md:text-sm transition-colors inline-block cursor-pointer"
        >
          Ver perfil →
        </a>
      </div>
    </div>
  `,
})
export class ProfesorCardComponent {
  @Input({ required: true }) profesor!: Profesor;
  @Input() isDestacado = false;
  @Input() theme: 'cerulean' | 'punch-red' | 'amber' = 'cerulean';
}
