import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  authLogin,
  authRegister,
  authLogout,
  authRestoreSession,
  authSetToken,
} from './auth.actions';
import {
  selectIsAuthenticated,
  selectIsAuthLoading,
  selectToken,
  selectUserId,
  selectAuthError,
  selectAuthStatus,
} from './auth.selectors';
import { AuthStatus } from './auth.reducer';

/**
 * AuthFacade shields components from knowing about NgRx actions / selectors.
 * Components inject this instead of `Store` directly.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(Store);

  // ─── Selectors ──────────────────────────────────────────────

  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly isLoading$: Observable<boolean> = this.store.select(selectIsAuthLoading);
  readonly token$: Observable<string | null> = this.store.select(selectToken);
  readonly userId$: Observable<number | null> = this.store.select(selectUserId);
  readonly error$: Observable<string | null> = this.store.select(selectAuthError);
  readonly status$: Observable<AuthStatus> = this.store.select(selectAuthStatus);

  // ─── Dispatchers ────────────────────────────────────────────

  login(email: string, password: string): void {
    this.store.dispatch(authLogin({ email, password }));
  }

  register(email: string, password: string): void {
    this.store.dispatch(authRegister({ email, password }));
  }

  logout(): void {
    this.store.dispatch(authLogout());
  }

  restoreSession(): void {
    this.store.dispatch(authRestoreSession());
  }

  /**
   * Called by the auth interceptor after a silent refresh to sync
   * the new token into the Store.
   */
  setToken(token: string, userId: number): void {
    this.store.dispatch(authSetToken({ token, userId }));
  }
}
