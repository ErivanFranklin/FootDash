import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
// Use namespace import to avoid default-import interop issues when compiled to CommonJS
import * as Joi from 'joi';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
