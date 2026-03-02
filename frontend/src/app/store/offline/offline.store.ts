import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, from, concatMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { OfflineService } from '../../core/services/offline.service';
import { LoggerService } from '../../core/services/logger.service';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QueuedPrediction {
  id: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  queuedAt: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface OfflineState {
  isOnline: boolean;
  queue: QueuedPrediction[];
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
}

const QUEUE_KEY = 'footdash_offline_predictions';

function readQueueFromStorage(): QueuedPrediction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persistQueue(queue: QueuedPrediction[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

const initialState: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queue: [],
  syncStatus: 'idle',
  lastSyncedAt: null,
  syncError: null,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const OfflineStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(store => ({
    pendingCount: computed(() => store.queue().length),
    hasPending: computed(() => store.queue().length > 0),
    isSyncing: computed(() => store.syncStatus() === 'syncing'),
  })),

  withMethods((
    store,
    http = inject(HttpClient),
    offlineSvc = inject(OfflineService),
    logger = inject(LoggerService),
    toastCtrl = inject(ToastController),
  ) => ({

    /**
     * Hydrate the queue from localStorage on app init.
     */
    hydrate(): void {
      const queue = readQueueFromStorage();
      patchState(store, { queue, isOnline: navigator.onLine });

      // Listen for network status changes
      offlineSvc.isOnline$.subscribe(online => {
        patchState(store, { isOnline: online });
        if (online && store.queue().length > 0) {
          this.flush();
        }
      });
    },

    /**
     * Add a prediction to the offline queue (called when user is offline).
     */
    addToQueue(prediction: Omit<QueuedPrediction, 'id' | 'queuedAt'>): void {
      const item: QueuedPrediction = {
        ...prediction,
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        queuedAt: new Date().toISOString(),
      };
      const updated = [...store.queue(), item];
      patchState(store, { queue: updated });
      persistQueue(updated);
      logger.info('[OfflineStore] Prediction queued', item);
    },

    /**
     * Remove a single item from the queue.
     */
    removeFromQueue(id: string): void {
      const updated = store.queue().filter(p => p.id !== id);
      patchState(store, { queue: updated });
      persistQueue(updated);
    },

    /**
     * Flush the queue — send all queued predictions to the server sequentially.
     * Stops on the first error (likely still offline or server issue).
     */
    flush: rxMethod<void>(
      pipe(
        tap(() => {
          if (store.queue().length === 0) return;
          patchState(store, { syncStatus: 'syncing', syncError: null });
        }),
        switchMap(() => {
          const queue = store.queue();
          if (queue.length === 0) return EMPTY;

          let synced = 0;

          return from(queue).pipe(
            concatMap(item =>
              http.post(`${environment.apiBaseUrl}/gamification/predict`, {
                matchId: item.matchId,
                homeScore: item.homeScore,
                awayScore: item.awayScore,
              }).pipe(
                tap(() => {
                  // Remove synced item
                  const updated = store.queue().filter(p => p.id !== item.id);
                  patchState(store, { queue: updated });
                  persistQueue(updated);
                  synced++;
                }),
                catchError((err: unknown) => {
                  logger.error('[OfflineStore] Failed to sync prediction', err);
                  patchState(store, {
                    syncStatus: 'error',
                    syncError: (err as Error)?.message ?? 'Sync failed',
                  });
                  return EMPTY; // Stop processing remaining items
                }),
              )
            ),
            tap({
              complete: async () => {
                if (synced > 0) {
                  patchState(store, {
                    syncStatus: 'synced',
                    lastSyncedAt: new Date().toISOString(),
                  });
                  const toast = await toastCtrl.create({
                    message: `${synced} offline prediction${synced > 1 ? 's' : ''} synced!`,
                    duration: 3000,
                    color: 'success',
                    position: 'bottom',
                  });
                  await toast.present();
                }
              },
            }),
          );
        }),
      )
    ),
  })),

  withHooks({
    onInit(store) {
      // Hydrate from localStorage when the store initializes
      store.hydrate();
    },
  }),
);
