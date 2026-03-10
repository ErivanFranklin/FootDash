import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/user.entity';
import { RefreshToken } from '../src/auth/refresh-token.entity';
import { LoginAudit } from '../src/auth/entities/login-audit.entity';
import { CreateUsersTable1680000000000 } from '../migrations/1680000000000-CreateUsersTable';
import { AddMatchMetadata1690001000000 } from '../migrations/1690001000000-AddMatchMetadata';
import { CreateNotificationsAndTeams1700000000000 } from '../migrations/1700000000000-CreateNotificationsAndTeams';
import { AddUserProfileAndPreferences1733783250000 } from '../migrations/1733783250000-AddUserProfileAndPreferences';
import { CreateRefreshTokens1740000000000 } from '../migrations/1740000000000-CreateRefreshTokens';

describe('Auth e2e (auth workflow)', () => {
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
          entities: [User, RefreshToken, LoginAudit],
          synchronize: false,
          migrationsRun: true,
          migrations: [
            CreateUsersTable1680000000000,
            AddMatchMetadata1690001000000,
            CreateNotificationsAndTeams1700000000000,
            AddUserProfileAndPreferences1733783250000,
            CreateRefreshTokens1740000000000,
          ],
        }),
        TypeOrmModule.forFeature([User, RefreshToken, LoginAudit]),
        JwtModule.register({ secret: process.env.JWT_SECRET || 'test-secret' }),
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  }, 180000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('register -> refresh -> revoke -> refresh(fails)', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'password123';
    const agent = request.agent(app.getHttpServer());

    const reg = await agent
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(reg.body?.tokens?.accessToken).toBeDefined();

    const refreshed = await agent.post('/auth/refresh').expect(201);

    expect(refreshed.body?.tokens?.accessToken).toBeDefined();

    await agent.post('/auth/revoke').expect(201);

    // now the same refresh should be rejected
    await agent.post('/auth/refresh').expect(401);
  }, 180000);

  it('register -> login -> profile', async () => {
    const email = `e2e-profile-${Date.now()}@example.com`;
    const password = 'password123';

    // Register a new user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    // Login to get an access token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = loginRes.body?.tokens?.accessToken;
    expect(accessToken).toBeDefined();

    // Get profile with the access token
    const profileRes = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileRes.body).toBeDefined();
    expect(profileRes.body.email).toEqual(email);
    expect(profileRes.body.id).toBeDefined();
    expect(profileRes.body.passwordHash).toBeUndefined();

    // Try to get profile without a token
    await request(app.getHttpServer()).get('/auth/profile').expect(401);
  }, 180000);
});
