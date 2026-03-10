import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
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
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /** Maps socket.id → { userId, matchId } */
  private connectedUsers = new Map<
    string,
    { userId: number; matchId: number }
  >();

  constructor(private chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    const info = this.connectedUsers.get(client.id);
    if (info) {
      this.connectedUsers.delete(client.id);
      this.broadcastOnlineUsers(info.matchId);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { matchId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const matchId = typeof data === 'number' ? data : data.matchId;
    const userId = typeof data === 'number' ? 0 : data.userId;
    const room = `match-${matchId}`;
    client.join(room);
    this.connectedUsers.set(client.id, { userId, matchId });
    this.logger.log(`Client ${client.id} (user ${userId}) joined room ${room}`);
    this.broadcastOnlineUsers(matchId);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: number | { matchId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const matchId = typeof data === 'number' ? data : data.matchId;
    const room = `match-${matchId}`;
    client.leave(room);
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client ${client.id} left room ${room}`);
    this.broadcastOnlineUsers(matchId);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @MessageBody()
    payload: {
      userId: number;
      matchId: number;
      content: string;
    },
  ) {
    const savedMsg = await this.chatService.saveMessage(
      payload.userId,
      payload.matchId,
      payload.content,
    );

    const room = `match-${payload.matchId}`;
    this.server.to(room).emit('new-message', savedMsg);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    payload: { matchId: number; userId: number; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `match-${payload.matchId}`;
    client.to(room).emit('user-typing', {
      userId: payload.userId,
      username: payload.username,
    });
  }

  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @MessageBody() payload: { matchId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `match-${payload.matchId}`;
    client.to(room).emit('user-stop-typing', {
      userId: payload.userId,
    });
  }

  private broadcastOnlineUsers(matchId: number) {
    const room = `match-${matchId}`;
    const usersInRoom = new Set<number>();
    for (const [, info] of this.connectedUsers) {
      if (info.matchId === matchId && info.userId > 0) {
        usersInRoom.add(info.userId);
      }
    }
    this.server.to(room).emit('online-users', {
      count: usersInRoom.size,
      userIds: [...usersInRoom],
    });
  }
}
