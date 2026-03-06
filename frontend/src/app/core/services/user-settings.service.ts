import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  userId: number;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: number;
  userId: number;
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'pt' | 'fr';
  notificationEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  favoriteTeamIds: number[];
  timezone: string;
  updatedAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface AuthSession {
  id: number;
  createdAt: string;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  current: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl || '';

  // ─── Profile ────────────────────────────────────────

  getProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/${userId}/profile`, { withCredentials: true });
  }

  updateProfile(userId: number, data: { displayName?: string; bio?: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/${userId}/profile`, data, { withCredentials: true });
  }

  uploadAvatar(userId: number, file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<UserProfile>(`${this.baseUrl}/users/${userId}/profile/avatar`, fd, { withCredentials: true });
  }

  deleteAvatar(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/profile/avatar`, { withCredentials: true });
  }

  // ─── Preferences ───────────────────────────────────

  getPreferences(userId: number): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.baseUrl}/users/${userId}/preferences`, { withCredentials: true });
  }

  updatePreferences(userId: number, data: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${this.baseUrl}/users/${userId}/preferences`, data, { withCredentials: true });
  }

  updateTheme(
    userId: number,
    theme: UserPreferences['theme'],
  ): Observable<UserPreferences> {
    // Use upsert-safe endpoint so first-time users without preferences rows don't get 404.
    return this.updatePreferences(userId, { theme });
  }

  updateNotificationPrefs(
    userId: number,
    data: { notificationEnabled?: boolean; emailNotifications?: boolean; pushNotifications?: boolean },
  ): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${userId}/preferences/notifications`, data, { withCredentials: true });
  }

  // ─── Account ───────────────────────────────────────

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/change-password`, data, { withCredentials: true });
  }

  getTwoFactorStatus(): Observable<TwoFactorStatus> {
    return this.http.get<TwoFactorStatus>(`${this.baseUrl}/auth/2fa/status`, { withCredentials: true });
  }

  setupTwoFactor(): Observable<TwoFactorSetup> {
    return this.http.post<TwoFactorSetup>(`${this.baseUrl}/auth/2fa/setup`, {}, { withCredentials: true });
  }

  verifyTwoFactor(code: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.baseUrl}/auth/2fa/verify`, { code }, { withCredentials: true });
  }

  enableTwoFactor(code: string): Observable<{ recoveryCodes: string[] }> {
    return this.http.post<{ recoveryCodes: string[] }>(`${this.baseUrl}/auth/2fa/enable`, { code }, { withCredentials: true });
  }

  disableTwoFactor(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/2fa/disable`, { code }, { withCredentials: true });
  }

  getSessions(): Observable<AuthSession[]> {
    return this.http.get<AuthSession[]>(`${this.baseUrl}/auth/sessions`, { withCredentials: true });
  }

  revokeSession(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/auth/sessions/${id}`, { withCredentials: true });
  }
}
