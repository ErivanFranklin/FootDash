import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Report } from '../social/entities/report.entity';

describe('Admin Dashboard E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let reportsRepository: Repository<Report>;
  let adminToken: string;
  let userToken: string;
  let testUserId: number;
  let reportId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    usersRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    reportsRepository = moduleFixture.get<Repository<Report>>(getRepositoryToken(Report));

    // Create test users and get auth tokens
    await setupTestUsers();
  });

  afterAll(async () => {
    // Clean up test data
    await usersRepository.delete({});
    await reportsRepository.delete({});
    await app.close();
  });

  async function setupTestUsers() {
    // Create admin user
    const adminUser = await usersRepository.save({
      email: 'admin@test.com',
      password_hash: 'hashed_password',
      role: UserRole.ADMIN,
    });

    // Create regular user
    const regularUser = await usersRepository.save({
      email: 'user@test.com',
      password_hash: 'hashed_password',
      role: UserRole.USER,
    });

    testUserId = regularUser.id;

    // Mock auth tokens (in real scenario, use actual auth endpoints)
    adminToken = 'mock-admin-jwt-token';
    userToken = 'mock-user-jwt-token';
  }

  describe('Admin Authorization (GET /api/admin/users)', () => {
    it('should deny access to non-authenticated users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401);
    });

    it('should deny access to non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow access to admin users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('User Management Workflows', () => {
    describe('GET /api/admin/users', () => {
      it('should return paginated list of users', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users?limit=50&offset=0')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('limit');
            expect(res.body).toHaveProperty('offset');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('GET /api/admin/users/search', () => {
      it('should search users by email', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/search?email=user@test.com')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            if (res.body.length > 0) {
              expect(res.body[0].email).toContain('user@test.com');
            }
          });
      });

      it('should return empty array for non-matching email', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/search?email=nonexistent@test.com')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toEqual([]);
          });
      });
    });

    describe('GET /api/admin/users/:userId', () => {
      it('should return user details', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('email');
            expect(res.body).toHaveProperty('role');
            expect(res.body.id).toBe(testUserId);
          });
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .get('/api/admin/users/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('POST /api/admin/users/:userId/block', () => {
      it('should successfully block a user', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${testUserId}/block`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('blocked');
            expect(res.body.userId).toBe(testUserId);
          });
      });

      it('should not allow blocking admin users', async () => {
        const adminUser = await usersRepository.findOne({
          where: { role: UserRole.ADMIN },
        });

        return request(app.getHttpServer())
          .post(`/api/admin/users/${adminUser.id}/block`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      });
    });

    describe('POST /api/admin/users/:userId/unblock', () => {
      it('should successfully unblock a user', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/users/${testUserId}/unblock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('unblocked');
          });
      });
    });

    describe('DELETE /api/admin/users/:userId', () => {
      it('should successfully delete a user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('deleted');
          });
      });

      it('should return 404 for already deleted user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  describe('Content Moderation Workflows', () => {
    beforeEach(async () => {
      // Create test report
      const reporter = await usersRepository.findOne({
        where: { role: UserRole.USER },
      });

      const targetUser = await usersRepository.save({
        email: 'target@test.com',
        password_hash: 'hashed_password',
        role: UserRole.USER,
      });

      const report = await reportsRepository.save({
        reason: 'Inappropriate language',
        status: 'pending',
        reporter,
        targetUser,
      });

      reportId = report.id;
    });

    describe('GET /api/admin/reports', () => {
      it('should return paginated list of reports', () => {
        return request(app.getHttpServer())
          .get('/api/admin/reports?limit=50&offset=0')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });

      it('should filter reports by status', () => {
        return request(app.getHttpServer())
          .get('/api/admin/reports?status=pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body.data)).toBe(true);
          });
      });
    });

    describe('GET /api/admin/reports/:reportId', () => {
      it('should return report details', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/reports/${reportId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('reason');
            expect(res.body).toHaveProperty('status');
            expect(res.body.id).toBe(reportId);
          });
      });
    });

    describe('POST /api/admin/reports/:reportId/approve', () => {
      it('should approve report with action', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/reports/${reportId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ action: 'block_user' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.action).toBe('block_user');
          });
      });
    });

    describe('POST /api/admin/reports/:reportId/reject', () => {
      it('should reject a report', () => {
        return request(app.getHttpServer())
          .post(`/api/admin/reports/${reportId}/reject`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('rejected');
          });
      });
    });
  });

  describe('System Monitoring Workflows', () => {
    describe('GET /api/admin/health', () => {
      it('should return system health stats', () => {
        return request(app.getHttpServer())
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('database');
            expect(res.body).toHaveProperty('reports');
            expect(res.body).toHaveProperty('websockets');
            expect(res.body.database).toHaveProperty('status');
            expect(res.body.database).toHaveProperty('users');
            expect(res.body.reports).toHaveProperty('total');
            expect(res.body.reports).toHaveProperty('pending');
          });
      });

      it('should show correct user counts', () => {
        return request(app.getHttpServer())
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(typeof res.body.database.users.total).toBe('number');
            expect(typeof res.body.database.users.admins).toBe('number');
            expect(res.body.database.users.total).toBeGreaterThanOrEqual(0);
            expect(res.body.database.users.admins).toBeGreaterThanOrEqual(0);
          });
      });
    });
  });

  describe('Complete Admin Workflow', () => {
    it('should complete full user management workflow: list -> search -> block -> unblock', async () => {
      const newUser = await usersRepository.save({
        email: 'workflow-test@test.com',
        password_hash: 'hashed_password',
        role: UserRole.USER,
      });

      // Step 1: List users
      const listRes = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);

      // Step 2: Search for user
      const searchRes = await request(app.getHttpServer())
        .get('/api/admin/users/search?email=workflow-test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.length).toBeGreaterThan(0);

      // Step 3: Get user details
      const detailsRes = await request(app.getHttpServer())
        .get(`/api/admin/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(detailsRes.status).toBe(200);

      // Step 4: Block user
      const blockRes = await request(app.getHttpServer())
        .post(`/api/admin/users/${newUser.id}/block`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(blockRes.status).toBe(201);

      // Step 5: Unblock user
      const unblockRes = await request(app.getHttpServer())
        .post(`/api/admin/users/${newUser.id}/unblock`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(unblockRes.status).toBe(201);

      // Cleanup
      await usersRepository.delete(newUser.id);
    });
  });
});
