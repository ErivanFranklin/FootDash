import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnModuleInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

export interface SocialEventData {
  type: 'comment' | 'reaction' | 'follow';
  targetType: 'match' | 'prediction';
  targetId: number;
  userId: number;
  userName: string;
  data: any;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend's domain
  },
  namespace: '/social',
})
export class SocialGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocialGateway.name);

  onModuleInit() {
    this.logger.log('Social WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Social client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Social client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-social')
  handleSubscribe(
    @MessageBody() data: { targetType: 'match' | 'prediction'; targetId: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.targetType || !data.targetId) {
      this.logger.warn(`Invalid social subscription request from ${client.id}`);
      return;
    }

    const roomName = `${data.targetType}-${data.targetId}`;
    this.logger.log(`Client ${client.id} subscribed to social room ${roomName}`);
    client.join(roomName);

    // Acknowledge subscription
    client.emit('social-subscribed', {
      targetType: data.targetType,
      targetId: data.targetId,
      message: `Subscribed to ${data.targetType} ${data.targetId} social updates`,
    });
  }

  @SubscribeMessage('unsubscribe-social')
  handleUnsubscribe(
    @MessageBody() data: { targetType: 'match' | 'prediction'; targetId: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.targetType || !data.targetId) {
      this.logger.warn(`Invalid social unsubscription request from ${client.id}`);
      return;
    }

    const roomName = `${data.targetType}-${data.targetId}`;
    this.logger.log(`Client ${client.id} unsubscribed from social room ${roomName}`);
    client.leave(roomName);

    client.emit('social-unsubscribed', {
      targetType: data.targetType,
      targetId: data.targetId,
      message: `Unsubscribed from ${data.targetType} ${data.targetId} social updates`,
    });
  }

  // Broadcast social events to subscribed clients
  broadcastSocialEvent(eventData: SocialEventData) {
    const roomName = `${eventData.targetType}-${eventData.targetId}`;
    this.logger.log(`Broadcasting ${eventData.type} event to room ${roomName}`);

    if (this.server) {
      this.server.to(roomName).emit('social-event', eventData);
    }
  }

  // Broadcast to all connected clients (for global feed updates)
  broadcastGlobalEvent(eventData: SocialEventData) {
    this.logger.log(`Broadcasting global ${eventData.type} event`);

    if (this.server) {
      this.server.emit('global-social-event', eventData);
    }
  }
}