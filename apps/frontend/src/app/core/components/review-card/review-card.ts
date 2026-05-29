import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input({ required: true }) reviewId!: string;
  @Input({ required: true }) author!: string;
  @Input() authorImage?: string;
  @Input({ required: true }) timeAgo!: string;
  @Input({ required: true }) rating!: number; // 1 to 5
  @Input({ required: true }) comment!: string;
  @Input() subject?: string;
  @Input() isEdited = false;
  @Input() isOwnReview = false;
  @Input() likesCount = 0;
  @Input() dislikesCount = 0;
  @Input() hasLiked = false;
  @Input() hasDisliked = false;

  @Output() onLike = new EventEmitter<void>();
  @Output() onDislike = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onReport = new EventEmitter<void>();



  get authorInitial(): string {
    return this.author ? this.author.charAt(0).toUpperCase() : '?';
  }

  get themeClasses() {
    return {
      avatarBg: 'bg-cerulean-100',
      avatarText: 'text-cerulean-600',
    };
  }

  get starsArray() {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }
}
