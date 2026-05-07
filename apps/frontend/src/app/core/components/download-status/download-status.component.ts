import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type DownloadStatusState = 'available' | 'empty' | 'first-time';

@Component({
  selector: 'app-download-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './download-status.component.html',
})
export class DownloadStatusComponent {
  state = input<DownloadStatusState>('available');
  downloadsLeft = input<number>(0);
  maxDownloads = input<number>(5);
  lastDownloadDate = input<string | null>(null);

  progressPercentage = computed(() => {
    if (this.maxDownloads() === 0) return 0;
    return Math.min(100, Math.max(0, (this.downloadsLeft() / this.maxDownloads()) * 100));
  });
}
