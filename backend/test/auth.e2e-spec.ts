import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/user.entity';
import { RefreshToken } from '../src/auth/refresh-token.entity';

describe('Auth e2e (auth workflow)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, RefreshToken],
          synchronize: true,
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([User, RefreshToken]),
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

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
  }, 20000);

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
  }, 20000);
});
