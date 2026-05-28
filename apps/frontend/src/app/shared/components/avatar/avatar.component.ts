import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IUserResponse } from '@eduno/shared';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  user = input<IUserResponse | null>(null);
  name = input<string>('');
  image = input<string>('');
  theme = input<'cerulean' | 'punch-red' | 'amber' | 'admin' | 'profesor' | 'alumno' | 'moderador' | 'gray' | 'blue' | 'green' | 'yellow' | ''>('');
  size = input<'sm' | 'md' | 'lg' | 'xl' | 'xxl'>('md');
  cssClass = input<string>('');

  initials = computed(() => {
    const usr = this.user();
    if (usr) {
      return usr.initialLetter || usr.name?.charAt(0)?.toUpperCase() || '';
    }
    const nm = this.name();
    return nm ? nm.charAt(0).toUpperCase() : '';
  });

  avatarImage = computed(() => {
    const usr = this.user();
    if (usr) {
      return usr.image || '';
    }
    return this.image() || '';
  });

  containerClass = computed(() => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-20 h-20 text-2xl',
      xxl: 'w-32 h-32 text-5xl',
    };

    const theme = this.theme();
    let colorClasses = '';

    if (theme === 'admin' || theme === 'gray') {
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-250';
    } else if (theme === 'profesor' || theme === 'blue') {
      colorClasses = 'bg-blue-50/70 text-blue-600 border-blue-150';
    } else if (theme === 'alumno' || theme === 'green') {
      colorClasses = 'bg-green-50/70 text-green-600 border-green-150';
    } else if (theme === 'moderador' || theme === 'yellow') {
      colorClasses = 'bg-yellow-50/70 text-yellow-600 border-yellow-150';
    } else if (theme === 'cerulean') {
      colorClasses = 'bg-cerulean-50 text-cerulean-600 border-cerulean-100';
    } else if (theme === 'punch-red') {
      colorClasses = 'bg-punch-red-50 text-punch-red-600 border-punch-red-100';
    } else if (theme === 'amber') {
      colorClasses = 'bg-amber-50 text-amber-600 border-amber-100';
    } else {
      const role = this.user()?.role;
      if (role === 'admin') {
        colorClasses = 'bg-gray-100 text-gray-700 border-gray-250';
      } else if (role === 'profesor') {
        colorClasses = 'bg-blue-50/70 text-blue-600 border-blue-150';
      } else if (role === 'alumno') {
        colorClasses = 'bg-green-50/70 text-green-600 border-green-150';
      } else if (role === 'moderador') {
        colorClasses = 'bg-yellow-50/70 text-yellow-600 border-yellow-150';
      } else {
        colorClasses = 'bg-cerulean-100 text-cerulean-700 border-cerulean-200';
      }
    }

    return `${sizeClasses[this.size()]} ${this.cssClass()} ${colorClasses} rounded-full flex items-center justify-center font-bold shrink-0 shadow-xs border overflow-hidden aspect-square`;
  });
}
