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
  user = input.required<IUserResponse | null>();
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  cssClass = input<string>('');

  containerClass = computed(() => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-20 h-20 text-2xl',
    };

    const role = this.user()?.role;
    let colorClasses = 'bg-cerulean-100 text-cerulean-700 border-cerulean-200';

    if (role === 'admin') {
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-250';
    } else if (role === 'profesor') {
      colorClasses = 'bg-blue-50/70 text-blue-600 border-blue-150';
    } else if (role === 'alumno') {
      colorClasses = 'bg-green-50/70 text-green-600 border-green-150';
    } else if (role === 'moderador') {
      colorClasses = 'bg-yellow-50/70 text-yellow-600 border-yellow-150';
    }

    return `${sizeClasses[this.size()]} ${this.cssClass()} ${colorClasses} rounded-full flex items-center justify-center font-bold shrink-0 shadow-xs border overflow-hidden`;
  });
}
