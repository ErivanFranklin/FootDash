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
  handleMatchSubscription(
    @MessageBody() matchId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Client ${client.id} subscribed to match ${matchId}`);
    client.join(matchId);
    // In a real app, you would fetch initial data and send it here
    this.server.to(matchId).emit('match-update', {
      matchId,
      message: `Welcome to match ${matchId}`,
      score: { home: 0, away: 0 },
    });
  }

  @SubscribeMessage('unsubscribe-match')
  handleMatchUnsubscription(
    @MessageBody() matchId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Client ${client.id} unsubscribed from match ${matchId}`);
    client.leave(matchId);
  }

  // Example of how you would broadcast a match update
  // This would be called from your service layer when new data is available
  broadcastMatchUpdate(matchId: string, data: any) {
    this.logger.log(`Broadcasting update for match ${matchId}`);
    this.server.to(matchId).emit('match-update', data);
  }
}
