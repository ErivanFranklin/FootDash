import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface SocialEvent {
  type: 'comment' | 'reaction' | 'follow';
  targetType: 'match' | 'prediction';
  targetId: number;
  userId: number;
  userName: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private socialSocket: Socket | null = null;

  // Connection status
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private socialConnectionStatus$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeSockets();
  }

  private initializeSockets() {
    // Main socket for general events
    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      transports: ['websocket', 'polling'],
    });

    // Social socket for social events
    this.socialSocket = io(`${environment.apiBaseUrl.replace('/api', '')}/social`, {
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();
    this.setupSocialSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to main WebSocket');
      this.connectionStatus$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from main WebSocket');
      this.connectionStatus$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Main WebSocket connection error:', error);
      this.connectionStatus$.next(false);
    });
  }

  private setupSocialSocketListeners() {
    if (!this.socialSocket) return;

    this.socialSocket.on('connect', () => {
      console.log('Connected to social WebSocket');
      this.socialConnectionStatus$.next(true);
    });

    this.socialSocket.on('disconnect', () => {
      console.log('Disconnected from social WebSocket');
      this.socialConnectionStatus$.next(false);
    });

    this.socialSocket.on('connect_error', (error) => {
      console.error('Social WebSocket connection error:', error);
      this.socialConnectionStatus$.next(false);
    });

    // Social event listeners
    this.socialSocket.on('social-event', (event: SocialEvent) => {
      console.log('Received social event:', event);
      // Events are handled by individual components
    });

    this.socialSocket.on('global-social-event', (event: SocialEvent) => {
      console.log('Received global social event:', event);
      // Global events like follows
    });

    this.socialSocket.on('new-follower', (data: any) => {
      console.log('Received new follower notification:', data);
    });
  }

  // Connection status observables
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  getSocialConnectionStatus(): Observable<boolean> {
    return this.socialConnectionStatus$.asObservable();
  }

  // Match subscription methods
  subscribeToMatch(matchId: string) {
    if (this.socket) {
      this.socket.emit('subscribe-match', { matchId });
    }
  }

  unsubscribeFromMatch(matchId: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe-match', { matchId });
    }
  }

  // Social subscription methods
  subscribeToSocial(targetType: 'match' | 'prediction', targetId: number) {
    if (this.socialSocket) {
      this.socialSocket.emit('subscribe-social', { targetType, targetId });
    }
  }

  unsubscribeFromSocial(targetType: 'match' | 'prediction', targetId: number) {
    if (this.socialSocket) {
      this.socialSocket.emit('unsubscribe-social', { targetType, targetId });
    }
  }

  subscribeToUser(userId: number) {
    if (this.socialSocket) {
      this.socialSocket.emit('subscribe-user', { userId });
    }
  }

  unsubscribeFromUser(userId: number) {
    if (this.socialSocket) {
      this.socialSocket.emit('unsubscribe-user', { userId });
    }
  }

  // Listen to social events
  onSocialEvent(): Observable<SocialEvent> {
    return new Observable<SocialEvent>((observer) => {
      if (this.socialSocket) {
        const handler = (event: SocialEvent) => observer.next(event);
        this.socialSocket.on('social-event', handler);

        return () => {
          if (this.socialSocket) {
            this.socialSocket.off('social-event', handler);
          }
        };
      } else {
        observer.complete();
        return () => {};
      }
    });
  }

  // Listen to global social events
  onGlobalSocialEvent(): Observable<SocialEvent> {
    return new Observable<SocialEvent>((observer) => {
      if (this.socialSocket) {
        const handler = (event: SocialEvent) => observer.next(event);
        this.socialSocket.on('global-social-event', handler);

        return () => {
          if (this.socialSocket) {
            this.socialSocket.off('global-social-event', handler);
          }
        };
      } else {
        observer.complete();
        return () => {};
      }
    });
  }

  onNewFollower(): Observable<any> {
    return new Observable<any>((observer) => {
      if (this.socialSocket) {
        const handler = (data: any) => observer.next(data);
        this.socialSocket.on('new-follower', handler);

        return () => {
          if (this.socialSocket) {
            this.socialSocket.off('new-follower', handler);
          }
        };
      } else {
        observer.complete();
        return () => {};
      }
    });
  }

  // Listen to match updates
  onMatchUpdate(): Observable<any> {
    return new Observable<any>((observer) => {
      if (this.socket) {
        const handler = (data: any) => observer.next(data);
        this.socket.on('match-update', handler);

        return () => {
          if (this.socket) {
            this.socket.off('match-update', handler);
          }
        };
      } else {
        observer.complete();
        return () => {};
      }
    });
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.socialSocket) {
      this.socialSocket.disconnect();
      this.socialSocket = null;
    }

    this.connectionStatus$.next(false);
    this.socialConnectionStatus$.next(false);
  }
}