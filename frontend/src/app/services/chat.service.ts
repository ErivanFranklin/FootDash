import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

export interface ChatMessage {
  id?: number;
  userId: number;
  matchId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    username?: string;
    email?: string;
  };
}

export interface TypingEvent {
  userId: number;
  username: string;
}

export interface OnlineUsersEvent {
  count: number;
  userIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messageSubject = new Subject<ChatMessage>();
  private typingSubject = new Subject<TypingEvent>();
  private stopTypingSubject = new Subject<{ userId: number }>();
  private onlineUsersSubject = new Subject<OnlineUsersEvent>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiBaseUrl}/chat`;

  constructor() {
    this.socket = io(`${environment.websocketUrl}/chat`, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('new-message', (msg: ChatMessage) => {
      this.messageSubject.next(msg);
    });

    this.socket.on('user-typing', (evt: TypingEvent) => {
      this.typingSubject.next(evt);
    });

    this.socket.on('user-stop-typing', (evt: { userId: number }) => {
      this.stopTypingSubject.next(evt);
    });

    this.socket.on('online-users', (evt: OnlineUsersEvent) => {
      this.onlineUsersSubject.next(evt);
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinRoom(matchId: number) {
    const userId = this.authService.getCurrentUserId() ?? 0;
    this.socket.emit('join-room', { matchId, userId });
  }

  leaveRoom(matchId: number) {
    this.socket.emit('leave-room', { matchId });
  }

  sendMessage(matchId: number, content: string, userId: number) {
    this.socket.emit('send-message', { matchId, content, userId });
  }

  emitTyping(matchId: number, userId: number, username: string) {
    this.socket.emit('typing', { matchId, userId, username });
  }

  emitStopTyping(matchId: number, userId: number) {
    this.socket.emit('stop-typing', { matchId, userId });
  }

  /** Load chat history from REST endpoint */
  getRecentMessages(matchId: number, limit = 50): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${matchId}/messages?limit=${limit}`);
  }

  onNewMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  onTyping(): Observable<TypingEvent> {
    return this.typingSubject.asObservable();
  }

  onStopTyping(): Observable<{ userId: number }> {
    return this.stopTypingSubject.asObservable();
  }

  onOnlineUsers(): Observable<OnlineUsersEvent> {
    return this.onlineUsersSubject.asObservable();
  }
}
