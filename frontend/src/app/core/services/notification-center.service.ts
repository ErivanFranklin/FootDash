import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, map, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebSocketService, SocialEvent } from './web-socket.service';
import { AuthService } from './auth.service';

export enum AlertType {
  FOLLOWER = 'follower',
  REACTION = 'reaction',
  COMMENT = 'comment',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export interface Alert {
  id: number;
  userId: number;
  alertType: AlertType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedUserId?: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertsPage {
  alerts: Alert[];
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationCenterService {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private authService = inject(AuthService);

  private apiUrl = `${environment.apiBaseUrl || ''}/alerts`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  /** Fetch unread count and subscribe to real-time new-alert events. */
  init(userId: number): void {
    this.loadUnreadCount();

    // Subscribe to personal room for real-time alerts
    this.ws.subscribeToUser(userId);
    this.ws.onSocialEvent().subscribe((event: SocialEvent) => {
      if (event.type === 'new-alert' || event.type === 'alert') {
        // Increment unread count on new alert
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      }
    });
  }

  loadUnreadCount(): void {
    // Guard: don't poll when user is not authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }
    this.getUnreadAlerts(1).pipe(
      catchError(() => of([] as Alert[])),
    ).subscribe(alerts => {
      // The backend returns unread alerts — use the array length as a count
      // For a precise count we use the by-type endpoint
      this.getCountsByType().pipe(
        catchError(() => of({} as Record<string, number>)),
      ).subscribe(counts => {
        const total = Object.values(counts).reduce((sum: number, c: number) => sum + c, 0);
        this.unreadCountSubject.next(total);
      });
    });
  }

  getUnreadAlerts(limit = 20): Observable<Alert[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Alert[]>(`${this.apiUrl}/unread`, { params, withCredentials: true });
  }

  getAlerts(page = 1, limit = 20): Observable<AlertsPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<AlertsPage>(`${this.apiUrl}`, { params, withCredentials: true });
  }

  markAsRead(alertId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${alertId}/read`, {}, { withCredentials: true }).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        if (current > 0) this.unreadCountSubject.next(current - 1);
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {}, { withCredentials: true }).pipe(
      tap(() => this.unreadCountSubject.next(0)),
    );
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${alertId}`, { withCredentials: true });
  }

  getCountsByType(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/counts/by-type`, { withCredentials: true });
  }

  /** Returns a human-readable relative time, e.g. "5 min ago" */
  static relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  /** Returns an ion-icon name for the given alert type. */
  static iconForType(type: AlertType): string {
    switch (type) {
      case AlertType.FOLLOWER: return 'person-add-outline';
      case AlertType.REACTION: return 'heart-outline';
      case AlertType.COMMENT:  return 'chatbubble-outline';
      case AlertType.MENTION:  return 'at-outline';
      case AlertType.SYSTEM:   return 'information-circle-outline';
      default:                 return 'notifications-outline';
    }
  }

  /** Returns a color for the given alert type. */
  static colorForType(type: AlertType): string {
    switch (type) {
      case AlertType.FOLLOWER: return 'primary';
      case AlertType.REACTION: return 'danger';
      case AlertType.COMMENT:  return 'tertiary';
      case AlertType.MENTION:  return 'warning';
      case AlertType.SYSTEM:   return 'medium';
      default:                 return 'primary';
    }
  }
}
