import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('NotificationsController (e2e-like)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 20000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /notifications/diagnostics returns expected shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications/diagnostics')
      .expect(200);

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('shortCount');
    expect(res.body).toHaveProperty('short');
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.shortCount).toBe('number');
    expect(Array.isArray(res.body.short)).toBe(true);
  });
});
