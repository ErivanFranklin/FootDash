import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState, authFeatureKey } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>(authFeatureKey);

export const selectToken = createSelector(
  selectAuthState,
  state => state.token
);

export const selectUserId = createSelector(
  selectAuthState,
  state => state.userId
);

export const selectAuthStatus = createSelector(
  selectAuthState,
  state => state.status
);

export const selectAuthError = createSelector(
  selectAuthState,
  state => state.error
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  state => state.status === 'authenticated' && !!state.token
);

export const selectIsAuthLoading = createSelector(
  selectAuthState,
  state => state.status === 'loading'
);
