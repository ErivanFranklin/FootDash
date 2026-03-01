import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { OfflineService } from '../../core/services/offline.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    @if (!(offlineService.isOnline$ | async)) {
      <div class="offline-banner">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <span>You're offline</span>
        @if (queueService.pendingCount() > 0) {
          <span class="queued-badge">{{ queueService.pendingCount() }} pending</span>
        }
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      bottom: 56px;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #e63946;
      color: #fff;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 8px 16px;
      text-align: center;
      animation: slide-up 0.3s ease-out;
    }
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }
    ion-icon {
      font-size: 1.1rem;
    }
    .queued-badge {
      background: rgba(255,255,255,0.25);
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 0.78rem;
    }
  `],
})
export class OfflineBannerComponent {
  offlineService = inject(OfflineService);
  queueService = inject(OfflineQueueService);
}
