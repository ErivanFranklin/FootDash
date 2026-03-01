import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

  private http = inject(HttpClient);

  /**
   * Attempt to restore the session on app boot by calling /auth/refresh.
   * The browser automatically sends the HttpOnly refresh_token cookie.
   */
  tryRestoreSession(): Observable<boolean> {
    return this.http
      .post<any>(`${this.authUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          if (token) this.setToken(token);
        }),
        map(res => !!res?.tokens?.accessToken),
        catchError(() => of(false)),
      );
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.authUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(res => {
          const token = res?.tokens?.accessToken;
          if (token) this.setToken(token);
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
          this.clearSession();
          return throwError(() => err);
        }),
      );
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

  setToken(token: string): void {
    this.accessToken = token;
    this.currentTokenSubject.next(token);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.currentTokenSubject.next(null);
  }
}

function buildAuthUrl(): string {
  const base = environment.apiBaseUrl?.replace(/\/$/, '') || '';
  const path = environment.authPath?.startsWith('/') ? environment.authPath : `/${environment.authPath || ''}`;
  return `${base}${path}` || '/auth';
}
