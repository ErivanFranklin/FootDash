import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationToken } from './notification-token.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import util from 'util';
import axios from 'axios';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';
import { Match } from '../matches/entities/match.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging?: admin.messaging.Messaging;
  private enabled = false;
  private debugEnabled = false;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(NotificationToken)
    private readonly tokenRepository: Repository<NotificationToken>,
  ) {
    // Read debug flag before initializing to control verbose logging
    this.debugEnabled = this.config.get<string>('NOTIFICATIONS_DEBUG') === 'true';
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
      this.logger.warn(
        'Firebase initialization failed, push notifications disabled',
        error as Error,
      );
    }
  }

  async registerToken(payload: RegisterNotificationTokenDto) {
    const token = payload.token?.trim();
    if (!token) {
      throw new BadRequestException('token is required');
    }

    // Additional server-side sanity check: reject obviously short/malformed tokens
    if (typeof token === 'string' && token.length < 50) {
      throw new BadRequestException('token is too short or malformed');
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

  async getTokenDiagnostics() {
    const tokens = await this.tokenRepository.find();
    const total = tokens.length;
    const short = tokens
      .filter((t) => !t.token || t.token.length < 50)
      .map((t) => ({
        id: t.id,
        tokenPreview: (t.token || '').slice(0, 60),
        len: (t.token || '').length,
      }));
    return { total, shortCount: short.length, short };
  }

  async sendMatchNotice(
    match: Match,
    event: 'match-start' | 'goal' | 'result',
    summary: string,
  ) {
    this.logger.log(
      `sendMatchNotice called for match=${match?.id} event=${event}`,
    );
    if (!this.enabled || !this.messaging) {
      this.logger.debug(
        'Push notification skipped because Firebase is not configured',
      );
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
      if (this.debugEnabled) {
        // Verbose debug: log tokens being sent (only token strings, limit to 2000 chars)
        try {
          const tokenList = tokens.map((t) => t.token);
          const tokenPreview = JSON.stringify(tokenList).slice(0, 2000);
          this.logger.debug(
            `Sending multicast to tokens (${tokenList.length}): ${tokenPreview}`,
          );
        } catch (err) {
          this.logger.debug(
            'Failed to stringify tokens for debug logging',
            err as Error,
          );
        }
      }

      const response = await this.messaging.sendEachForMulticast(message);
      // Conditionally log full response details in a JSON-friendly form
      if (this.debugEnabled) {
        try {
          const respDetails = response.responses.map((r, i) => ({
            index: i,
            success: r.success,
            error: r.error
              ? { message: r.error.message, code: (r.error as any).code }
              : null,
          }));
          this.logger.debug(
            `FCM full response: ${util.inspect(respDetails, { depth: 5 })}`,
          );
        } catch (err) {
          this.logger.debug(
            'Failed to serialize FCM response for debug logging',
            err as Error,
          );
        }
      }
      // Log summary of the multicast response for local verification
      this.logger.log(
        `FCM multicast result: success=${response.successCount}, failure=${response.failureCount}`,
      );
      if (response.failureCount > 0) {
        const failed = response.responses
          .map((r, i) => ({ r, token: tokens[i] }))
          .filter(({ r }) => !r.success)
          .map(({ r, token }) => ({
            token: token.token,
            error: r.error?.message ?? r.error?.code,
          }));
        this.logger.warn('FCM failed responses:', JSON.stringify(failed));

        // Send monitoring webhook if configured
        try {
          const webhook = this.config.get<string>('MONITORING_WEBHOOK_URL');
          if (webhook) {
            await axios.post(webhook, {
              source: 'notifications',
              project: this.config.get<string>('FCM_PROJECT_ID') || null,
              matchId: match?.id ?? null,
              event,
              successCount: response.successCount,
              failureCount: response.failureCount,
              failed,
              timestamp: new Date().toISOString(),
            }, { timeout: 5000 });
          }
        } catch (monitorErr) {
          this.logger.debug('Failed to send monitoring webhook', monitorErr as Error);
        }
      }

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
          [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ].includes(result.error?.code ?? ''),
      )
      .map(({ token }) => token);

    if (!toRemove.length) {
      return;
    }

    await this.tokenRepository.remove(toRemove);
    this.logger.log(`Removed ${toRemove.length} invalid notification tokens`);
  }
}
