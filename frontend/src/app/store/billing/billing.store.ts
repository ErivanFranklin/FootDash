import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
export type BillingLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description?: string;
}

// ─── State ──────────────────────────────────────────────────────────────────

export interface BillingState {
  subscription: SubscriptionInfo;
  history: PaymentHistoryItem[];
  subscriptionStatus: BillingLoadStatus;
  historyStatus: BillingLoadStatus;
  checkoutLoading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  subscription: { tier: 'free', status: 'none' },
  history: [],
  subscriptionStatus: 'idle',
  historyStatus: 'idle',
  checkoutLoading: false,
  error: null,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const BillingStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(store => ({
    isPro: computed(() => {
      const s = store.subscription();
      return (s.tier === 'pro' || s.tier === 'premium') && s.status === 'active';
    }),
    isSubscriptionLoading: computed(() => store.subscriptionStatus() === 'loading'),
    isHistoryLoading: computed(() => store.historyStatus() === 'loading'),
    formattedHistory: computed(() =>
      store.history().map(h => ({
        ...h,
        formattedAmount: `${(h.amount / 100).toFixed(2)} ${h.currency.toUpperCase()}`,
      }))
    ),
  })),

  withMethods((store, http = inject(HttpClient)) => {
    const apiUrl = `${environment.apiBaseUrl}/payments`;

    return {
      /**
       * Load current subscription info.
       */
      loadSubscription: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { subscriptionStatus: 'loading', error: null })),
          switchMap(() =>
            http.get<SubscriptionInfo>(`${apiUrl}/subscription`, { withCredentials: true }).pipe(
              tap(subscription => patchState(store, { subscription, subscriptionStatus: 'loaded' })),
              catchError((err: unknown) => {
                patchState(store, {
                  subscriptionStatus: 'error',
                  error: (err as Error)?.message ?? 'Failed to load subscription',
                });
                return EMPTY;
              }),
            )
          ),
        )
      ),

      /**
       * Load payment history.
       */
      loadHistory: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { historyStatus: 'loading', error: null })),
          switchMap(() =>
            http.get<PaymentHistoryItem[]>(`${apiUrl}/history`, { withCredentials: true }).pipe(
              tap(history => patchState(store, { history, historyStatus: 'loaded' })),
              catchError((err: unknown) => {
                patchState(store, {
                  historyStatus: 'error',
                  error: (err as Error)?.message ?? 'Failed to load history',
                });
                return EMPTY;
              }),
            )
          ),
        )
      ),

      /**
       * Start checkout session — redirects to Stripe.
       */
      startCheckout: rxMethod<string | undefined>(
        pipe(
          tap(() => patchState(store, { checkoutLoading: true, error: null })),
          switchMap(priceId =>
            http.post<{ url: string }>(`${apiUrl}/create-checkout-session`, { priceId }, { withCredentials: true }).pipe(
              tap(res => {
                patchState(store, { checkoutLoading: false });
                window.location.href = res.url;
              }),
              catchError((err: unknown) => {
                patchState(store, {
                  checkoutLoading: false,
                  error: (err as Error)?.message ?? 'Failed to start checkout',
                });
                return EMPTY;
              }),
            )
          ),
        )
      ),
    };
  }),
);
