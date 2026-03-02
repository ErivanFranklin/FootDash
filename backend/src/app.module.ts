import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/database.module';
import { FootballApiModule } from './football-api/football-api.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SocialModule } from './social/social.module';
import { GamificationModule } from './gamification/gamification.module';
import { PaymentsModule } from './payments/payments.module';
import { SearchModule } from './search/search.module';
import { FavoritesModule } from './favorites/favorites.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';
import { HealthModule } from './health/health.module';
import { FantasyModule } from './fantasy/fantasy.module';
import { LeagueModule } from './leagues/league.module';
import { HighlightsModule } from './highlights/highlights.module';
import { OddsModule } from './odds/odds.module';
// Use namespace import to avoid default-import interop issues when compiled to CommonJS
import * as Joi from 'joi';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().optional(),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().allow('').default(''),
        DB_NAME: Joi.string().default('footdash'),
        JWT_SECRET: Joi.string().default('change-me'),
        FOOTBALL_API_MOCK: Joi.boolean().default(!isProd),
        FOOTBALL_API_URL: Joi.string().uri().when('FOOTBALL_API_MOCK', {
          is: true,
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        FOOTBALL_API_KEY: Joi.string().when('FOOTBALL_API_MOCK', {
          is: true,
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        FOOTBALL_API_TIMEOUT_MS: Joi.number().default(5000),
        REDIS_URL: Joi.string().uri().optional(),
        FCM_PROJECT_ID: Joi.string().optional(),
        FCM_CLIENT_EMAIL: Joi.string().optional(),
        FCM_PRIVATE_KEY: Joi.string().optional(),
        // Stripe payments
        STRIPE_SECRET_KEY: isProd ? Joi.string().required() : Joi.string().optional(),
        STRIPE_WEBHOOK_SECRET: isProd ? Joi.string().required() : Joi.string().optional(),
        STRIPE_PRO_PRICE_ID: isProd ? Joi.string().required() : Joi.string().optional(),
        FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
        // SMTP / Mail
        SMTP_HOST: Joi.string().default('localhost'),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().allow('').default(''),
        SMTP_PASS: Joi.string().allow('').default(''),
        MAIL_FROM: Joi.string().default('"FootDash" <noreply@footdash.app>'),
        // ML Service
        ML_SERVICE_URL: Joi.string().uri().when('$env', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().uri().default('http://localhost:8000'),
        }),
        // Phase 13 optional external API keys
        YOUTUBE_API_KEY: Joi.string().optional().allow(''),
        ODDS_API_KEY: Joi.string().optional().allow(''),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    FootballApiModule,
    TeamsModule,
    MatchesModule,
    WebsocketsModule,
    NotificationsModule,
    UsersModule,
    AnalyticsModule,
    SocialModule,
    GamificationModule,
    PaymentsModule,
    SearchModule,
    FavoritesModule,
    DashboardModule,
    ExportModule,
    HealthModule,
    FantasyModule,
    LeagueModule,
    HighlightsModule,
    OddsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
