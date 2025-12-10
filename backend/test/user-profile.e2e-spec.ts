import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../src/users/user.entity';
import { UserProfile } from '../src/users/entities/user-profile.entity';
import { UserPreferences } from '../src/users/entities/user-preferences.entity';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { RefreshToken } from '../src/auth/refresh-token.entity';

describe('UserProfile E2E', () => {
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
    const email = `profile-e2e-${Date.now()}@example.com`;
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

  describe('GET /users/:userId/profile', () => {
    it('should return 404 when profile does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return profile after creation', async () => {
      // First create a profile
      await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Test User',
          bio: 'Test bio',
        })
        .expect(200);

      // Then get it
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.displayName).toBe('Test User');
      expect(res.body.bio).toBe('Test bio');
      expect(res.body.userId).toBe(userId);
    });
  });

  describe('PUT /users/:userId/profile', () => {
    it('should create a new profile', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'New User',
          bio: 'New bio',
        })
        .expect(200);

      expect(res.body.displayName).toBe('New User');
      expect(res.body.bio).toBe('New bio');
      expect(res.body.userId).toBe(userId);
    });

    it('should update an existing profile', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Updated Name',
          bio: 'Updated bio',
        })
        .expect(200);

      expect(res.body.displayName).toBe('Updated Name');
      expect(res.body.bio).toBe('Updated bio');
    });

    it('should validate displayName length', async () => {
      await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'AB', // Too short (min 3)
        })
        .expect(400);
    });

    it('should validate bio length', async () => {
      await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'x'.repeat(501), // Too long (max 500)
        })
        .expect(400);
    });

    it('should allow updating only displayName', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: 'Only Name',
        })
        .expect(200);

      expect(res.body.displayName).toBe('Only Name');
    });
  });

  describe('POST /users/:userId/profile/avatar', () => {
    it('should upload avatar successfully', async () => {
      // Create a small test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post(`/users/${userId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, 'test.png');

      expect([200, 201]).toContain(res.status);

      expect(res.body.avatarUrl).toContain('/uploads/avatars/');
      expect(res.body.avatarUrl).toMatch(/\.png$/);
    });

    it('should reject file that is too large', async () => {
      // Create a buffer larger than 2MB
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024);

      await request(app.getHttpServer())
        .post(`/users/${userId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', largeBuffer, 'large.jpg')
        .expect(400);
    });

    it('should reject invalid file type', async () => {
      const textBuffer = Buffer.from('This is not an image');

      await request(app.getHttpServer())
        .post(`/users/${userId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', textBuffer, 'test.txt')
        .expect(400);
    });
  });

  describe('DELETE /users/:userId/profile/avatar', () => {
    it('should delete avatar', async () => {
      // First upload an avatar
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      await request(app.getHttpServer())
        .post(`/users/${userId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, 'test.png');

      // Then delete it
      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.avatarUrl).toBeNull();
    });

    it('should return 404 when trying to delete avatar from non-existent profile', async () => {
      const nonExistentUserId = 99999;

      await request(app.getHttpServer())
        .delete(`/users/${nonExistentUserId}/profile/avatar`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
