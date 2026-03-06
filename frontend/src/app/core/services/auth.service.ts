import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError, switchMap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Store } from '@ngrx/store';
import { authLogoutSuccess, authSetToken } from '../../store/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper = new JwtHelperService();
  private authUrl = buildAuthUrl();

  /**
   * Access token is stored in memory only (not localStorage) to mitigate XSS.
   * The refresh token is stored as an HttpOnly cookie managed by the backend.
   */
  private accessToken: string | null = null;
  private currentTokenSubject = new BehaviorSubject<string | null>(null);
  public currentToken$ = this.currentTokenSubject.asObservable();
  public isAuthenticated$ = this.currentToken$.pipe(
    map(token => !!token && !this.jwtHelper.isTokenExpired(token))
  );

  /** True while a silent refresh is in-flight (prevents duplicate calls). */
  private refreshInFlight = false;

  /**
   * In-flight session restore observable (shared via shareReplay).
   * Prevents concurrent callers from issuing duplicate refresh requests.
   */
  private restoreInFlight$: Observable<boolean> | null = null;

  /**
   * Cached result of the last tryRestoreSession call.
   * Prevents the guard from repeating a just-completed APP_INITIALIZER call.
   */
  private lastRestoreResult: { value: boolean; time: number } | null = null;

  private http = inject(HttpClient);
  private store = inject(Store);

  /**
   * Attempt to restore the session on app boot by calling /auth/refresh.
   * The browser automatically sends the HttpOnly refresh_token cookie.
   */
  tryRestoreSession(): Observable<boolean> {
    // Return cached result only if the last restore SUCCEEDED recently.
    // We do NOT cache failures because cookies may arrive asynchronously
    // (e.g. the APP_INITIALIZER fires before the login Set-Cookie is
    // committed but the guard fires after — the retry must proceed).
    if (this.lastRestoreResult?.value && Date.now() - this.lastRestoreResult.time < 5000) {
      console.warn('[AuthService] tryRestoreSession → cached success');
      return of(true);
    }

    // If a restore request is already in-flight, share it.
    if (this.restoreInFlight$) {
      console.warn('[AuthService] tryRestoreSession → sharing in-flight');
      return this.restoreInFlight$;
    }

    // Issue a new refresh request.
    const url = `${this.authUrl}/refresh`;
    console.warn('[AuthService] tryRestoreSession → POST', url);
    const source$ = this.http
      .post<any>(url, {}, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          console.warn('[AuthService] tryRestoreSession response:', token ? 'got token' : 'NO token');
          if (token) this.setToken(token);
          this.lastRestoreResult = { value: true, time: Date.now() };
        }),
        map(res => !!res?.tokens?.accessToken),
        catchError((err) => {
          console.warn('[AuthService] tryRestoreSession FAILED →', err?.status, err?.error?.message ?? err?.message);
          return of(false);
        }),
        // shareReplay keeps the result for concurrent subscribers (e.g. guard
        // subscribing while the APP_INITIALIZER request is still in-flight).
        // Do NOT clear restoreInFlight$ inside tap — that would null the ref
        // before shareReplay has a chance to serve late subscribers.
        shareReplay(1),
      );
    this.restoreInFlight$ = source$;
    return source$;
  }

  login(email: string, password: string, twoFactorCode?: string, recoveryCode?: string): Observable<any> {
    const payload: Record<string, string> = { email, password };
    if (twoFactorCode) payload['twoFactorCode'] = twoFactorCode;
    if (recoveryCode) payload['recoveryCode'] = recoveryCode;

    return this.http
      .post<any>(`${this.authUrl}/login`, payload, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          if (token) this.setToken(token);
          // Clear the cache so tryRestoreSession works fresh on new tabs.
          this.lastRestoreResult = null;
        }),
      );
  }

  register(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.authUrl}/register`, { email, password }, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          if (token) this.setToken(token);
        }),
      );
  }

  /**
   * Calls /auth/refresh to get a new access token.
   * The HttpOnly cookie is sent automatically.
   */
  refreshAccessToken(): Observable<string | null> {
    if (this.refreshInFlight) {
      // Return current token while another refresh is pending
      return of(this.accessToken);
    }
    this.refreshInFlight = true;
    return this.http
      .post<any>(`${this.authUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          if (token) this.setToken(token);
          this.refreshInFlight = false;
        }),
        map(res => res?.tokens?.accessToken || null),
        catchError(err => {
          this.refreshInFlight = false;
          // Do not clear the session here. A 401 on one endpoint can be
          // permission-related and not necessarily a globally invalid session.
          // The interceptor decides whether to invalidate the session.
          return throwError(() => err);
        }),
      );
  }

  /** Invalidate local auth state without calling revoke endpoint. */
  invalidateSession(): void {
    this.clearSession();
  }

  logout(): void {
    // Tell backend to revoke + clear the cookie
    this.http
      .post(`${this.authUrl}/revoke`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });
    this.clearSession();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !this.jwtHelper.isTokenExpired(this.accessToken);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getCurrentUserId(): number | null {
    if (!this.accessToken) return null;
    const decoded = this.jwtHelper.decodeToken(this.accessToken);
    return decoded?.sub || null;
  }

  getCurrentUserRole(): 'USER' | 'ADMIN' | 'MODERATOR' | null {
    if (!this.accessToken) return null;
    const decoded = this.jwtHelper.decodeToken(this.accessToken);
    const role = decoded?.role;
    if (role === 'USER' || role === 'ADMIN' || role === 'MODERATOR') {
      return role;
    }
    return null;
  }

  setToken(token: string): void {
    this.accessToken = token;
    this.currentTokenSubject.next(token);
    const decoded = this.jwtHelper.decodeToken(token);
    const userId = decoded?.sub ?? 0;
    this.store.dispatch(authSetToken({ token, userId }));
  }

  private clearSession(): void {
    this.accessToken = null;
    this.currentTokenSubject.next(null);
    this.store.dispatch(authLogoutSuccess());
  }
}

function buildAuthUrl(): string {
  const base = environment.apiBaseUrl?.replace(/\/$/, '') || '';
  const path = environment.authPath?.startsWith('/') ? environment.authPath : `/${environment.authPath || ''}`;
  return `${base}${path}` || '/auth';
}
