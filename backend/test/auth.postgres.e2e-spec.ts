import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/user.entity';
import { RefreshToken } from '../src/auth/refresh-token.entity';
import { CreateUsersTable1680000000000 } from '../migrations/1680000000000-CreateUsersTable';
import { AddMatchMetadata1690001000000 } from '../migrations/1690001000000-AddMatchMetadata';
import { CreateNotificationsAndTeams1700000000000 } from '../migrations/1700000000000-CreateNotificationsAndTeams';
import { AddUserProfileAndPreferences1733783250000 } from '../migrations/1733783250000-AddUserProfileAndPreferences';
import { CreateRefreshTokens1740000000000 } from '../migrations/1740000000000-CreateRefreshTokens';

describe('Auth e2e (Postgres)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT || 5432);
    const username = process.env.DB_USERNAME || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';
    const database = process.env.DB_NAME || 'footdash';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [User, RefreshToken],
          // Use migrations for E2E to get deterministic schema creation instead of synchronize
          synchronize: false,
          migrationsRun: true,
          // Load migrations from the repository; ts-jest will handle TS files during tests
          migrations: [
            CreateUsersTable1680000000000,
            AddMatchMetadata1690001000000,
            CreateNotificationsAndTeams1700000000000,
            AddUserProfileAndPreferences1733783250000,
            CreateRefreshTokens1740000000000,
          ],
        }),
        TypeOrmModule.forFeature([User, RefreshToken]),
        JwtModule.register({ secret: process.env.JWT_SECRET || 'test-secret' }),
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    await app.init();
  }, 180000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('register -> refresh -> revoke -> refresh(fails)', async () => {
    const email = `pg-e2e-${Date.now()}@example.com`;
    const password = 'password123';
    const agent = request.agent(app.getHttpServer());

    const reg = await agent
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(reg.body?.tokens?.accessToken).toBeDefined();

    const refreshed = await agent
      .post('/auth/refresh')
      .expect(201);

    expect(refreshed.body?.tokens?.accessToken).toBeDefined();

    await agent
      .post('/auth/revoke')
      .expect(201);

    // now the same refresh should be rejected
    await agent
      .post('/auth/refresh')
      .expect(401);
  }, 180000);
});
