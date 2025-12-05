import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.websocketUrl, {
      transports: ['websocket'],
    });
  }

  subscribeToMatch(matchId: number) {
    this.socket.emit('subscribe-match', { matchId });
  }

unsubscribefromMatch(matchId: number) {
    this.socket.emit('unsubscribe-match', { matchId });
  }

  onMatchUpdate(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('match-update', (data: any) => {
        observer.next(data);
      });
    });
  }
}
