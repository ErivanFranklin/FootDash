import { AuthState, authFeatureKey } from './auth/auth.reducer';

/** Root NgRx state shape. Feature states are registered lazily via the store. */
export interface AppState {
  [authFeatureKey]: AuthState;
}
