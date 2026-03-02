import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  NotificationCenterService,
  Alert,
  AlertsPage,
} from '../../core/services/notification-center.service';
import { WebSocketService, SocialEvent } from '../../core/services/web-socket.service';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface NotificationsState {
  alerts: Alert[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  currentPage: number;
  status: LoadStatus;
  error: string | null;
}

const initialState: NotificationsState = {
  alerts: [],
  unreadCount: 0,
  total: 0,
  hasMore: false,
  currentPage: 1,
  status: 'idle',
  error: null,
};

export const NotificationsStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(store => ({
    unreadAlerts: computed(() => store.alerts().filter(a => !a.isRead)),
    readAlerts: computed(() => store.alerts().filter(a => a.isRead)),
    isLoading: computed(() => store.status() === 'loading'),
    hasBadge: computed(() => store.unreadCount() > 0),
  })),

  withMethods((store, svc = inject(NotificationCenterService), ws = inject(WebSocketService)) => ({

    /**
     * Load a page of alerts from the API.
     * Pass `page = 1` for initial load, or current + 1 for infinite scroll.
     */
    loadAlerts: rxMethod<{ page: number; limit?: number }>(
      pipe(
        tap(({ page }) => patchState(store, { status: 'loading', error: null, currentPage: page })),
        switchMap(({ page, limit }) =>
          svc.getAlerts(page, limit ?? 20).pipe(
            tap((res: AlertsPage) => {
              const existing = page === 1 ? [] : store.alerts();
              patchState(store, {
                alerts: [...existing, ...res.alerts],
                total: res.total,
                hasMore: res.hasMore,
                status: 'loaded',
              });
            }),
            catchError((err: unknown) => {
              patchState(store, { status: 'error', error: (err as Error)?.message ?? 'Failed to load alerts' });
              return EMPTY;
            }),
          )
        ),
      )
    ),

    /**
     * Load only the unread count (lightweight — called on app init).
     */
    loadUnreadCount: rxMethod<void>(
      pipe(
        switchMap(() =>
          svc.getCountsByType().pipe(
            tap(counts => {
              const total = Object.values(counts).reduce((sum: number, c: number) => sum + c, 0);
              patchState(store, { unreadCount: total });
            }),
            catchError(() => EMPTY),
          )
        ),
      )
    ),

    /**
     * Subscribe to real-time alert events via WebSocket.
     * Call once after auth (e.g. from AppComponent or an init effect).
     */
    listenForRealTimeAlerts: rxMethod<number>(
      pipe(
        tap(userId => ws.subscribeToUser(userId)),
        switchMap(() =>
          ws.onSocialEvent().pipe(
            tap((event: SocialEvent) => {
              if (event.type === 'new-alert' || event.type === 'alert') {
                patchState(store, { unreadCount: store.unreadCount() + 1 });
                // Optionally prepend the alert to the list if data is provided
                if (event.data) {
                  patchState(store, { alerts: [event.data as Alert, ...store.alerts()] });
                }
              }
            }),
          )
        ),
      )
    ),

    /**
     * Mark a single alert as read — optimistic update.
     */
    markAsRead: rxMethod<number>(
      pipe(
        tap(alertId => {
          // Optimistic: mark read in local state immediately
          const updated = store.alerts().map(a => a.id === alertId ? { ...a, isRead: true } : a);
          const newCount = Math.max(0, store.unreadCount() - 1);
          patchState(store, { alerts: updated, unreadCount: newCount });
        }),
        switchMap(alertId =>
          svc.markAsRead(alertId).pipe(
            catchError(() => EMPTY), // silently swallow — already optimistically updated
          )
        ),
      )
    ),

    /**
     * Mark all alerts as read.
     */
    markAllAsRead: rxMethod<void>(
      pipe(
        tap(() => {
          const updated = store.alerts().map(a => ({ ...a, isRead: true }));
          patchState(store, { alerts: updated, unreadCount: 0 });
        }),
        switchMap(() =>
          svc.markAllAsRead().pipe(
            catchError(() => EMPTY),
          )
        ),
      )
    ),

    /**
     * Delete an alert.
     */
    deleteAlert: rxMethod<number>(
      pipe(
        tap(alertId => {
          const target = store.alerts().find(a => a.id === alertId);
          const updated = store.alerts().filter(a => a.id !== alertId);
          const countDelta = target && !target.isRead ? 1 : 0;
          patchState(store, { alerts: updated, unreadCount: Math.max(0, store.unreadCount() - countDelta) });
        }),
        switchMap(alertId =>
          svc.deleteAlert(alertId).pipe(
            catchError(() => EMPTY),
          )
        ),
      )
    ),
  })),
);
