import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataExportController } from '../src/analytics/controllers/data-export.controller';
import { DataExportService } from '../src/analytics/services/data-export.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UserRole } from '../src/users/user.entity';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roleHeader = req.headers['x-test-role'];
    req.user = {
      sub: 1,
      email: 'test@example.com',
      role: roleHeader || UserRole.USER,
    };
    return true;
  }
}

describe('Analytics Export Authorization (e2e)', () => {
  let app: INestApplication;

  const exportServiceMock = {
    exportTrainingData: jest.fn().mockResolvedValue({
      data: [{ match_id: 1 }],
      metadata: {
        total_matches: 1,
        date_range: { start: null, end: null },
        leagues: [],
        seasons: [],
        export_timestamp: new Date().toISOString(),
      },
    }),
    convertToCSV: jest.fn().mockReturnValue('match_id\n1'),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DataExportController],
      providers: [
        RolesGuard,
        { provide: DataExportService, useValue: exportServiceMock },
        { provide: JwtAuthGuard, useClass: MockJwtAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 403 for non-admin user', async () => {
    await request(app.getHttpServer())
      .post('/analytics/export/training-data')
      .set('x-test-role', UserRole.USER)
      .send({})
      .expect(403);
  });

  it('returns 201 for admin user', async () => {
    await request(app.getHttpServer())
      .post('/analytics/export/training-data')
      .set('x-test-role', UserRole.ADMIN)
      .send({})
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
