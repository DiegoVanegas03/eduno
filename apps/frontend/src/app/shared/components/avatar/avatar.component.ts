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

    return `${sizeClasses[this.size()]} ${this.cssClass()} bg-cerulean-100 rounded-full flex items-center justify-center text-cerulean-700 font-bold shrink-0 shadow-sm border border-cerulean-200 overflow-hidden`;
  });
}
