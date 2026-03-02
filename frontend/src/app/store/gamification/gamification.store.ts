import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import {
  GamificationService,
  LeaderboardEntry,
  BadgeResponse,
} from '../../services/gamification.service';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface GamificationState {
  leaderboard: LeaderboardEntry[];
  badges: BadgeResponse[];
  period: 'weekly' | 'monthly' | 'all-time';
  badgesFilter: 'all' | 'unlocked' | 'locked';
  leaderboardStatus: LoadStatus;
  badgesStatus: LoadStatus;
  leaderboardError: string | null;
  badgesError: string | null;
}

const initialState: GamificationState = {
  leaderboard: [],
  badges: [],
  period: 'weekly',
  badgesFilter: 'all',
  leaderboardStatus: 'idle',
  badgesStatus: 'idle',
  leaderboardError: null,
  badgesError: null,
};

export const GamificationStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(store => ({
    unlockedBadges: computed(() => store.badges().filter(b => b.unlocked)),
    lockedBadges: computed(() => store.badges().filter(b => !b.unlocked)),

    filteredBadges: computed(() => {
      const all = store.badges();
      switch (store.badgesFilter()) {
        case 'unlocked': return all.filter(b => b.unlocked);
        case 'locked':   return all.filter(b => !b.unlocked);
        default:         return all;
      }
    }),

    isLeaderboardLoading: computed(() => store.leaderboardStatus() === 'loading'),
    isBadgesLoading: computed(() => store.badgesStatus() === 'loading'),
  })),

  withMethods((store, svc = inject(GamificationService)) => ({

    loadLeaderboard: rxMethod<'weekly' | 'monthly' | 'all-time'>(
      pipe(
        tap(period => patchState(store, { period, leaderboardStatus: 'loading', leaderboardError: null })),
        switchMap(period =>
          svc.getLeaderboard(period).pipe(
            tap(leaderboard => patchState(store, { leaderboard, leaderboardStatus: 'loaded' })),
            catchError((err: unknown) => {
              patchState(store, {
                leaderboardStatus: 'error',
                leaderboardError: (err as Error)?.message ?? 'Failed to load leaderboard',
              });
              return EMPTY;
            }),
          )
        ),
      )
    ),

    loadBadges: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { badgesStatus: 'loading', badgesError: null })),
        switchMap(() =>
          svc.getAllBadges().pipe(
            tap(badges => patchState(store, { badges, badgesStatus: 'loaded' })),
            catchError((err: unknown) => {
              patchState(store, {
                badgesStatus: 'error',
                badgesError: (err as Error)?.message ?? 'Failed to load badges',
              });
              return EMPTY;
            }),
          )
        ),
      )
    ),

    setBadgesFilter(filter: 'all' | 'unlocked' | 'locked'): void {
      patchState(store, { badgesFilter: filter });
    },
  })),
);
