import { createAction, props } from '@ngrx/store';

// ─── Login ──────────────────────────────────────────────────────────────────

export const authLogin = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const authLoginSuccess = createAction(
  '[Auth] Login Success',
  props<{ token: string; userId: number }>()
);

export const authLoginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// ─── Register ───────────────────────────────────────────────────────────────

export const authRegister = createAction(
  '[Auth] Register',
  props<{ email: string; password: string }>()
);

export const authRegisterSuccess = createAction(
  '[Auth] Register Success',
  props<{ token: string; userId: number }>()
);

export const authRegisterFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// ─── Logout ─────────────────────────────────────────────────────────────────

export const authLogout = createAction('[Auth] Logout');

export const authLogoutSuccess = createAction('[Auth] Logout Success');

// ─── Session restoration ────────────────────────────────────────────────────

export const authRestoreSession = createAction('[Auth] Restore Session');

export const authRestoreSessionSuccess = createAction(
  '[Auth] Restore Session Success',
  props<{ token: string; userId: number }>()
);

export const authRestoreSessionFailure = createAction(
  '[Auth] Restore Session Failure'
);

// ─── Token refresh (called by interceptor) ──────────────────────────────────

export const authSetToken = createAction(
  '[Auth] Set Token',
  props<{ token: string; userId: number }>()
);
