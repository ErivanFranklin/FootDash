
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper = new JwtHelperService();
  private authUrl = '/api/auth';
  private currentTokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public currentToken$ = this.currentTokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
      map(res => {
        if (res && res.token) {
          this.setToken(res.token);
        }
        return res;
      })
    );
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, { email, password });
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
