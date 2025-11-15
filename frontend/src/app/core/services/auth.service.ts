
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper = new JwtHelperService();
  // During local dev we call backend directly (dev server proxy was inconsistent).
  // The base URL + auth path now come from Angular environment configuration.
  private authUrl = buildAuthUrl();
  private currentTokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public currentToken$ = this.currentTokenSubject.asObservable();

  // prefer functional inject() per angular-eslint/prefer-inject
  private http = inject(HttpClient);

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
      map(res => {
        // backend returns { user, tokens: { accessToken, refreshToken } }
        const token = res?.tokens?.accessToken || res?.token || res?.accessToken;
        if (token) {
          this.setToken(token);
        }
        return res;
      })
    );
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, { email, password }).pipe(
      map(res => {
        // mirror login behavior: store token when provided
        const token = res?.tokens?.accessToken || res?.token || res?.accessToken;
        if (token) this.setToken(token);
        return res;
      })
    );
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.currentTokenSubject.next(token);
  }

  removeToken(): void {
    localStorage.removeItem('access_token');
    this.currentTokenSubject.next(null);
  }
}

function buildAuthUrl(): string {
  const base = environment.apiBaseUrl?.replace(/\/$/, '') || '';
  const path = environment.authPath?.startsWith('/') ? environment.authPath : `/${environment.authPath || ''}`;
  return `${base}${path}` || '/auth';
}
