import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend's domain
  },
})
export class MatchGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

    @SubscribeMessage('subscribe-match')
  handleSubscribe(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.matchId) {
      this.logger.warn(`Invalid subscription request from ${client.id}`);
      return;
    }
    this.logger.log(`Client ${client.id} subscribed to match ${data.matchId}`);
    client.join(data.matchId);

    // Acknowledge subscription and send initial data
    this.server.to(data.matchId).emit('match-update', {
      matchId: data.matchId,
      message: `Welcome to match ${data.matchId}`,
    });
  }

  @SubscribeMessage('unsubscribe-match')
  handleUnsubscribe(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.matchId) {
      this.logger.warn(`Invalid unsubscription request from ${client.id}`);
      return;
    }
    this.logger.log(
      `Client ${client.id} unsubscribed from match ${data.matchId}`,
    );
    client.leave(data.matchId);
  }
  // Broadcast a match update to all clients in the match room
  broadcastMatchUpdate(matchId: string, data: any) {
    this.logger.log(`Broadcasting update for match ${matchId}`);
    if (this.server) {
      this.server.to(matchId).emit('match-update', { matchId, ...data });
    }
  }
}
