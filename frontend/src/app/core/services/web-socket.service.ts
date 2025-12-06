import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private matchUpdate$ = new Subject<any>();
  private connectionStatus$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  private subscribedMatches = new Set<string>();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket) return;

    this.connectionStatus$.next('connecting');

    this.socket = io(environment.websocketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus$.next('connected');
      // Re-subscribe to any previously subscribed match rooms
      for (const matchId of Array.from(this.subscribedMatches)) {
        this.socket?.emit('subscribe-match', String(matchId));
      }
    });

    this.socket.on('disconnect', (reason: any) => {
      this.connectionStatus$.next('disconnected');
    });

    this.socket.on('connect_error', (err: any) => {
      this.connectionStatus$.next('error');
    });

    this.socket.on('match-update', (data: any) => {
      this.matchUpdate$.next(data);
    });
  }

  disconnect() {
    if (!this.socket) return;
    try {
      this.socket.disconnect();
    } catch (e) {
      // ignore
    }
    this.socket = null;
    this.connectionStatus$.next('disconnected');
  }

  subscribeToMatch(matchId: number) {
    const id = String(matchId);
    this.subscribedMatches.add(id);
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-match', id);
    }
  }

  unsubscribefromMatch(matchId: number) {
    const id = String(matchId);
    this.subscribedMatches.delete(id);
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe-match', id);
    }
  }

  onMatchUpdate(): Observable<any> {
    return this.matchUpdate$.asObservable();
  }

  connectionStatus(): Observable<'connecting' | 'connected' | 'disconnected' | 'error'> {
    return this.connectionStatus$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
