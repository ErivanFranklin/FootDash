/**
 * Consolidated WebSocket service (replaces both core/web-socket.service and services/websocket.service).
 *
 * Manages two Socket.IO connections:
 *   1. Main socket (match updates)
 *   2. Social namespace socket (comments, reactions, follows, alerts)
 *
 * Re-exported types: SocialEvent
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface SocialEvent {
  type: 'comment' | 'reaction' | 'follow' | 'new-alert' | 'alert';
  targetType?: 'match' | 'prediction';
  targetId?: number;
  userId?: number;
  userName?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private socialSocket: Socket | null = null;

  // Main socket state
  private matchUpdate$ = new Subject<any>();
  private connectionStatus$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private subscribedMatches = new Set<string>();

  // Social socket state
  private socialConnectionStatus$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeSockets();
  }

  // ──────────── Initialization ────────────

  private initializeSockets(): void {
    const wsUrl = environment.websocketUrl || window.location.origin;

    // Main socket for match events
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus$.next('connected');
      // Re-subscribe to any previously subscribed match rooms
      for (const matchId of Array.from(this.subscribedMatches)) {
        this.socket?.emit('subscribe-match', matchId);
      }
    });

    this.socket.on('disconnect', () => this.connectionStatus$.next('disconnected'));
    this.socket.on('connect_error', () => this.connectionStatus$.next('error'));
    this.socket.on('match-update', (data: any) => this.matchUpdate$.next(data));

    // Social namespace socket
    this.socialSocket = io(`${wsUrl}/social`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socialSocket.on('connect', () => this.socialConnectionStatus$.next(true));
    this.socialSocket.on('disconnect', () => this.socialConnectionStatus$.next(false));
    this.socialSocket.on('connect_error', () => this.socialConnectionStatus$.next(false));
  }

  // ──────────── Connection Status ────────────

  connectionStatus(): Observable<'connecting' | 'connected' | 'disconnected' | 'error'> {
    return this.connectionStatus$.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.connectionStatus$.subscribe(s => observer.next(s === 'connected'));
    });
  }

  getSocialConnectionStatus(): Observable<boolean> {
    return this.socialConnectionStatus$.asObservable();
  }

  // ──────────── Match Subscriptions ────────────

  subscribeToMatch(matchId: number | string): void {
    const id = String(matchId);
    this.subscribedMatches.add(id);
    if (this.socket?.connected) {
      this.socket.emit('subscribe-match', id);
    }
  }

  unsubscribeFromMatch(matchId: number | string): void {
    const id = String(matchId);
    this.subscribedMatches.delete(id);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-match', id);
    }
  }

  onMatchUpdate(): Observable<any> {
    return this.matchUpdate$.asObservable();
  }

  // ──────────── Social Subscriptions ────────────

  subscribeToSocial(targetType: 'match' | 'prediction', targetId: number): void {
    this.socialSocket?.emit('subscribe-social', { targetType, targetId });
  }

  unsubscribeFromSocial(targetType: 'match' | 'prediction', targetId: number): void {
    this.socialSocket?.emit('unsubscribe-social', { targetType, targetId });
  }

  subscribeToUser(userId: number): void {
    this.socialSocket?.emit('subscribe-user', { userId });
  }

  unsubscribeFromUser(userId: number): void {
    this.socialSocket?.emit('unsubscribe-user', { userId });
  }

  // ──────────── Social Event Listeners ────────────

  onSocialEvent(): Observable<SocialEvent> {
    return new Observable<SocialEvent>(observer => {
      if (!this.socialSocket) { observer.complete(); return () => {}; }
      const handler = (event: SocialEvent) => observer.next(event);
      this.socialSocket.on('social-event', handler);
      return () => { this.socialSocket?.off('social-event', handler); };
    });
  }

  onGlobalSocialEvent(): Observable<SocialEvent> {
    return new Observable<SocialEvent>(observer => {
      if (!this.socialSocket) { observer.complete(); return () => {}; }
      const handler = (event: SocialEvent) => observer.next(event);
      this.socialSocket.on('global-social-event', handler);
      return () => { this.socialSocket?.off('global-social-event', handler); };
    });
  }

  onNewFollower(): Observable<any> {
    return new Observable<any>(observer => {
      if (!this.socialSocket) { observer.complete(); return () => {}; }
      const handler = (data: any) => observer.next(data);
      this.socialSocket.on('new-follower', handler);
      return () => { this.socialSocket?.off('new-follower', handler); };
    });
  }

  // ──────────── Cleanup ────────────

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.socialSocket?.disconnect();
    this.socialSocket = null;
    this.connectionStatus$.next('disconnected');
    this.socialConnectionStatus$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
