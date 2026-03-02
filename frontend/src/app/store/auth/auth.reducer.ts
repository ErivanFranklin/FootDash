import { createReducer, on } from '@ngrx/store';
import {
  authLogin, authLoginSuccess, authLoginFailure,
  authRegister, authRegisterSuccess, authRegisterFailure,
  authLogout, authLogoutSuccess,
  authRestoreSession, authRestoreSessionSuccess, authRestoreSessionFailure,
  authSetToken,
} from './auth.actions';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export interface AuthState {
  token: string | null;
  userId: number | null;
  status: AuthStatus;
  error: string | null;
}

export const initialAuthState: AuthState = {
  token: null,
  userId: null,
  status: 'idle',
  error: null,
};

export const authFeatureKey = 'auth';

export const authReducer = createReducer(
  initialAuthState,

  // Login
  on(authLogin, state => ({ ...state, status: 'loading' as AuthStatus, error: null })),
  on(authLoginSuccess, (state, { token, userId }) => ({
    ...state, token, userId, status: 'authenticated' as AuthStatus, error: null,
  })),
  on(authLoginFailure, (state, { error }) => ({
    ...state, token: null, userId: null, status: 'error' as AuthStatus, error,
  })),

  // Register
  on(authRegister, state => ({ ...state, status: 'loading' as AuthStatus, error: null })),
  on(authRegisterSuccess, (state, { token, userId }) => ({
    ...state, token, userId, status: 'authenticated' as AuthStatus, error: null,
  })),
  on(authRegisterFailure, (state, { error }) => ({
    ...state, token: null, userId: null, status: 'error' as AuthStatus, error,
  })),

  // Logout
  on(authLogout, state => ({ ...state, status: 'loading' as AuthStatus })),
  on(authLogoutSuccess, () => ({
    token: null, userId: null, status: 'unauthenticated' as AuthStatus, error: null,
  })),

  // Restore session
  on(authRestoreSession, state => ({ ...state, status: 'loading' as AuthStatus })),
  on(authRestoreSessionSuccess, (state, { token, userId }) => ({
    ...state, token, userId, status: 'authenticated' as AuthStatus, error: null,
  })),
  on(authRestoreSessionFailure, state => ({
    ...state, token: null, userId: null, status: 'unauthenticated' as AuthStatus,
  })),

  // Token set externally (e.g. after silent refresh)
  on(authSetToken, (state, { token, userId }) => ({
    ...state, token, userId, status: 'authenticated' as AuthStatus, error: null,
  })),
);
