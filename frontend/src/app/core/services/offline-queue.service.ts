import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfflineService } from './offline.service';
import { LoggerService } from './logger.service';
import { ToastController } from '@ionic/angular';

export interface QueuedPrediction {
  id: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  queuedAt: string;
}

const QUEUE_KEY = 'footdash_offline_predictions';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private http = inject(HttpClient);
  private offlineService = inject(OfflineService);
  private logger = inject(LoggerService);
  private toastCtrl = inject(ToastController);

  constructor() {
    // When we come back online, attempt to flush the queue
    this.offlineService.isOnline$.subscribe(online => {
      if (online) {
        this.flushQueue();
      }
    });
  }

  queue(prediction: Omit<QueuedPrediction, 'id' | 'queuedAt'>): void {
    const item: QueuedPrediction = {
      ...prediction,
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      queuedAt: new Date().toISOString(),
    };
    const current = this.getQueue();
    current.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
    this.logger.info('[OfflineQueue] Prediction queued', item);
  }

  getQueue(): QueuedPrediction[] {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  pendingCount(): number {
    return this.getQueue().length;
  }

  private removeFromQueue(id: string): void {
    const updated = this.getQueue().filter(p => p.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  }

  async flushQueue(): Promise<void> {
    const queue = this.getQueue();
    if (!queue.length) return;

    this.logger.info(`[OfflineQueue] Flushing ${queue.length} queued prediction(s)`);
    let synced = 0;
    for (const item of queue) {
      try {
        await firstValueFrom(
          this.http.post(`${environment.apiBaseUrl}/gamification/predict`, {
            matchId: item.matchId,
            homeScore: item.homeScore,
            awayScore: item.awayScore,
          })
        );
        this.removeFromQueue(item.id);
        synced++;
      } catch (err) {
        this.logger.error('[OfflineQueue] Failed to sync prediction', err);
        break; // Stop on first error (likely still offline)
      }
    }

    if (synced > 0) {
      const toast = await this.toastCtrl.create({
        message: `${synced} offline prediction${synced > 1 ? 's' : ''} synced!`,
        duration: 3000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    }
  }
}
