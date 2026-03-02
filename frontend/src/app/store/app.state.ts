import { AuthState, authFeatureKey } from './auth/auth.reducer';

/**
 * Root NgRx state shape.
 *
 * Classic NgRx slices are registered here.
 * SignalStore features (Gamification, Notifications, Billing, Offline)
 * are self-contained and provided at root — they don't appear in AppState.
 */
export interface AppState {
  [authFeatureKey]: AuthState;
}
