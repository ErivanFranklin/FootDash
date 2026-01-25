import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  id?: number;
  userId: number;
  matchId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    username?: string; // If user entity has username
    email?: string; 
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messageSubject = new Subject<ChatMessage>();

  constructor() {
    this.socket = io(`${environment.websocketUrl}/chat`, {
        transports: ['websocket'],
        autoConnect: false,
    }); // Connect to /chat namespace

    this.socket.on('new-message', (msg: ChatMessage) => {
      this.messageSubject.next(msg);
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
    this.socket.emit('join-room', matchId);
  }

  leaveRoom(matchId: number) {
    this.socket.emit('leave-room', matchId);
  }

  sendMessage(matchId: number, content: string, userId: number) { 
    this.socket.emit('send-message', { matchId, content, userId });
  }

  onNewMessage(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }
}
