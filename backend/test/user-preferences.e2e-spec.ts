import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../src/users/user.entity';
import { UserProfile } from '../src/users/entities/user-profile.entity';
import {
  UserPreferences,
  Theme,
  Language,
} from '../src/users/entities/user-preferences.entity';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { RefreshToken } from '../src/auth/refresh-token.entity';

describe('UserPreferences E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT || 5432);
    const username = process.env.DB_USERNAME || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';
    const database = process.env.DB_NAME || 'footdash';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host,
          port,
          username,
          password: dbPassword,
          database,
          entities: [User, UserProfile, UserPreferences, RefreshToken],
          synchronize: false,
        }),
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          UserPreferences,
          RefreshToken,
        ]),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register a test user and get auth token
    const email = `preferences-e2e-${Date.now()}@example.com`;
    const password = 'password123';

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    authToken = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/:userId/preferences', () => {
    it('should return 404 when preferences do not exist', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return preferences after creation', async () => {
      // First create preferences
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.DARK,
          language: Language.ES,
          notificationEnabled: true,
        })
        .expect(200);

      // Then get them
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.theme).toBe(Theme.DARK);
      expect(res.body.language).toBe(Language.ES);
      expect(res.body.notificationEnabled).toBe(true);
      expect(res.body.userId).toBe(userId);
    });
  });

  describe('PUT /users/:userId/preferences', () => {
    it('should create default preferences', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      // When sending empty body, preferences are updated/created with defaults or preserve existing values
      expect(res.body).toHaveProperty('theme');
      expect(res.body).toHaveProperty('language');
      expect(res.body).toHaveProperty('notificationEnabled');
      expect(res.body.userId).toBe(userId);
    });

    it('should update all preferences', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.LIGHT,
          language: Language.PT,
          notificationEnabled: false,
          emailNotifications: false,
          pushNotifications: true,
          favoriteTeamIds: [1, 2, 3],
          timezone: 'America/Sao_Paulo',
        })
        .expect(200);

      expect(res.body.theme).toBe(Theme.LIGHT);
      expect(res.body.language).toBe(Language.PT);
      expect(res.body.notificationEnabled).toBe(false);
      expect(res.body.emailNotifications).toBe(false);
      expect(res.body.pushNotifications).toBe(true);
      expect(res.body.favoriteTeamIds).toEqual([1, 2, 3]);
      expect(res.body.timezone).toBe('America/Sao_Paulo');
    });

    it('should update only provided fields', async () => {
      // First set some preferences
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.DARK,
          language: Language.EN,
        })
        .expect(200);

      // Then update only theme
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.LIGHT,
        })
        .expect(200);

      expect(res.body.theme).toBe(Theme.LIGHT);
      expect(res.body.language).toBe(Language.EN); // Should remain unchanged
    });

    it('should validate theme enum', async () => {
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'invalid-theme',
        })
        .expect(400);
    });

    it('should validate language enum', async () => {
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'invalid-language',
        })
        .expect(400);
    });

    it('should validate favoriteTeamIds is an array', async () => {
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favoriteTeamIds: 'not-an-array',
        })
        .expect(400);
    });
  });

  describe('PATCH /users/:userId/preferences/theme', () => {
    it('should update only theme', async () => {
      // Set initial preferences
      await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.DARK,
          language: Language.ES,
        })
        .expect(200);

      // Update only theme
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/theme`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.LIGHT,
        })
        .expect(200);

      expect(res.body.theme).toBe(Theme.LIGHT);
      expect(res.body.language).toBe(Language.ES); // Should remain unchanged
    });

    it('should validate theme value', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/theme`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'invalid',
        })
        .expect(400);
    });

    it('should return 404 for non-existent preferences', async () => {
      const nonExistentUserId = 99999;

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentUserId}/preferences/theme`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.DARK,
        })
        .expect(404);
    });
  });

  describe('PATCH /users/:userId/preferences/notifications', () => {
    it('should update all notification settings', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationEnabled: false,
          emailNotifications: false,
          pushNotifications: true,
        })
        .expect(200);

      expect(res.body.notificationEnabled).toBe(false);
      expect(res.body.emailNotifications).toBe(false);
      expect(res.body.pushNotifications).toBe(true);
    });

    it('should update only specific notification settings', async () => {
      // Set initial state
      await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationEnabled: true,
          emailNotifications: true,
          pushNotifications: true,
        })
        .expect(200);

      // Update only emailNotifications
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: false,
        })
        .expect(200);

      expect(res.body.emailNotifications).toBe(false);
      expect(res.body.notificationEnabled).toBe(true); // Unchanged
      expect(res.body.pushNotifications).toBe(true); // Unchanged
    });

    it('should validate boolean types', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}/preferences/notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationEnabled: 'not-a-boolean',
        })
        .expect(400);
    });

    it('should return 404 for non-existent preferences', async () => {
      const nonExistentUserId = 99999;

      await request(app.getHttpServer())
        .patch(`/users/${nonExistentUserId}/preferences/notifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationEnabled: false,
        })
        .expect(404);
    });
  });

  describe('Integration: Profile and Preferences together', () => {
    it('should handle both profile and preferences for same user', async () => {
      // Create profile
      const profileRes = await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Integration Test User',
          bio: 'Testing profile and preferences',
        })
        .expect(200);

      expect(profileRes.body.displayName).toBe('Integration Test User');

      // Create preferences
      const prefsRes = await request(app.getHttpServer())
        .put(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: Theme.DARK,
          language: Language.FR,
        })
        .expect(200);

      expect(prefsRes.body.theme).toBe(Theme.DARK);
      expect(prefsRes.body.language).toBe(Language.FR);

      // Verify both exist independently
      const getProfile = await request(app.getHttpServer())
        .get(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const getPrefs = await request(app.getHttpServer())
        .get(`/users/${userId}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getProfile.body.userId).toBe(userId);
      expect(getPrefs.body.userId).toBe(userId);
    });
  });
});
