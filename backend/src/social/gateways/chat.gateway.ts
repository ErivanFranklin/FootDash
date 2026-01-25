import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() matchId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `match-${matchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() matchId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `match-${matchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @MessageBody() payload: { userId: number; matchId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // In real app, userId should be extracted from Auth token in socket handshake
    // For now we accept it from payload for simplicity/MVP
    const savedMsg = await this.chatService.saveMessage(payload.userId, payload.matchId, payload.content);
    
    // Broadcast to room
    const room = `match-${payload.matchId}`;
    this.server.to(room).emit('new-message', savedMsg);
  }
}
