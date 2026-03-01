import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-card.html',
  host: {
    class: 'block',
  },
})
export class ReviewCard {
  @Input({ required: true }) author!: string;
  @Input({ required: true }) timeAgo!: string;
  @Input({ required: true }) rating!: number; // 1 to 5
  @Input({ required: true }) comment!: string;
  @Input({ required: true }) subject!: string;
  @Input() colorTheme: 'punch-red' | 'cerulean' | 'oxford-navy' | 'honeydew' = 'cerulean';

  get authorInitial(): string {
    return this.author ? this.author.charAt(0).toUpperCase() : '?';
  }

  get themeClasses() {
    return {
      'punch-red': {
        avatarBg: 'bg-punch-red-100',
        avatarText: 'text-punch-red-600',
        badgeBg: 'bg-punch-red-50',
        badgeText: 'text-punch-red-700',
      },
      cerulean: {
        avatarBg: 'bg-cerulean-100',
        avatarText: 'text-cerulean-600',
        badgeBg: 'bg-cerulean-50',
        badgeText: 'text-cerulean-700',
      },
      'oxford-navy': {
        avatarBg: 'bg-oxford-navy-100',
        avatarText: 'text-oxford-navy-600',
        badgeBg: 'bg-oxford-navy-50',
        badgeText: 'text-oxford-navy-700',
      },
      honeydew: {
        avatarBg: 'bg-honeydew-100',
        avatarText: 'text-honeydew-600',
        badgeBg: 'bg-honeydew-50',
        badgeText: 'text-honeydew-700',
      },
    }[this.colorTheme];
  }

  get starsArray() {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }
}
