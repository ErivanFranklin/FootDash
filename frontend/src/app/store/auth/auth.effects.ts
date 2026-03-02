import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../core/services/auth.service';
import {
  authLogin, authLoginSuccess, authLoginFailure,
  authRegister, authRegisterSuccess, authRegisterFailure,
  authLogout, authLogoutSuccess,
  authRestoreSession, authRestoreSessionSuccess, authRestoreSessionFailure,
} from './auth.actions';

const jwtHelper = new JwtHelperService();

function extractUserId(token: string): number {
  const decoded = jwtHelper.decodeToken(token);
  return decoded?.sub ?? 0;
}

export const loginEffect = createEffect(
  () => {
    const actions$ = inject(Actions);
    const authService = inject(AuthService);
    return actions$.pipe(
      ofType(authLogin),
      switchMap(({ email, password }) =>
        authService.login(email, password).pipe(
          map(res => {
            const token: string = res?.tokens?.accessToken ?? '';
            return authLoginSuccess({ token, userId: extractUserId(token) });
          }),
          catchError(err =>
            of(authLoginFailure({ error: err?.error?.message ?? 'Login failed' }))
          ),
        )
      ),
    );
  },
  { functional: true }
);

export const registerEffect = createEffect(
  () => {
    const actions$ = inject(Actions);
    const authService = inject(AuthService);
    return actions$.pipe(
      ofType(authRegister),
      switchMap(({ email, password }) =>
        authService.register(email, password).pipe(
          map(res => {
            const token: string = res?.tokens?.accessToken ?? '';
            return authRegisterSuccess({ token, userId: extractUserId(token) });
          }),
          catchError(err =>
            of(authRegisterFailure({ error: err?.error?.message ?? 'Registration failed' }))
          ),
        )
      ),
    );
  },
  { functional: true }
);

export const logoutEffect = createEffect(
  () => {
    const actions$ = inject(Actions);
    const authService = inject(AuthService);
    return actions$.pipe(
      ofType(authLogout),
      tap(() => authService.logout()),
      map(() => authLogoutSuccess()),
    );
  },
  { functional: true }
);

export const restoreSessionEffect = createEffect(
  () => {
    const actions$ = inject(Actions);
    const authService = inject(AuthService);
    return actions$.pipe(
      ofType(authRestoreSession),
      switchMap(() =>
        authService.tryRestoreSession().pipe(
          map(success => {
            if (success) {
              const token = authService.getToken() ?? '';
              return authRestoreSessionSuccess({ token, userId: extractUserId(token) });
            }
            return authRestoreSessionFailure();
          }),
          catchError(() => of(authRestoreSessionFailure())),
        )
      ),
    );
  },
  { functional: true }
);
