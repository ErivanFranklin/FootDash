import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationToken } from './notification-token.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';
import { Match } from '../matches/entities/match.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging?: admin.messaging.Messaging;
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(NotificationToken)
    private readonly tokenRepository: Repository<NotificationToken>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const projectId = this.config.get<string>('FCM_PROJECT_ID');
    const clientEmail = this.config.get<string>('FCM_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FCM_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.debug('FCM credentials missing, notifications disabled');
      return;
    }

    try {
      const app = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        },
        'notifications',
      );
      this.messaging = app.messaging();
      this.enabled = true;
      this.logger.log('Firebase initialized for push notifications');
    } catch (error) {
      this.logger.warn('Firebase initialization failed, push notifications disabled', error as Error);
    }
  }

  async registerToken(payload: RegisterNotificationTokenDto) {
    const token = payload.token?.trim();
    if (!token) {
      throw new BadRequestException('token is required');
    }

    await this.tokenRepository.upsert(
      {
        token,
        platform: payload.platform,
        userId: payload.userId,
      },
      ['token'],
    );

    return { registered: true };
  }

  async sendMatchNotice(match: Match, event: 'match-start' | 'goal' | 'result', summary: string) {
    if (!this.enabled || !this.messaging) {
      this.logger.debug('Push notification skipped because Firebase is not configured');
      return;
    }

    const tokens = await this.tokenRepository.find();
    if (!tokens.length) {
      this.logger.debug('No notification tokens registered, skipping push');
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens.map((t) => t.token),
      notification: {
        title: `FootDash · Match update`,
        body: summary,
      },
      data: {
        matchId: String(match.id),
        event,
        homeTeam: match.homeTeam?.name ?? '',
        awayTeam: match.awayTeam?.name ?? '',
      },
    };

    try {
      const response = await this.messaging.sendEachForMulticast(message);
      this.cleanupFailedTokens(tokens, response);
    } catch (error) {
      this.logger.warn('Failed to publish push notification', error as Error);
    }
  }

  private async cleanupFailedTokens(
    tokens: NotificationToken[],
    response: admin.messaging.BatchResponse,
  ) {
    const toRemove = response.responses
      .map((result, index) => ({ result, token: tokens[index] }))
      .filter(
        ({ result }) =>
          !result.success &&
          ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(
            result.error?.code ?? '',
          ),
      )
      .map(({ token }) => token);

    if (!toRemove.length) {
      return;
    }

    await this.tokenRepository.remove(toRemove);
    this.logger.log(`Removed ${toRemove.length} invalid notification tokens`);
  }
}
