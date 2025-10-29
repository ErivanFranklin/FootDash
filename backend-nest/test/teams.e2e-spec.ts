import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../src/teams/teams.module';
import { Team } from '../src/teams/entities/team.entity';
import { Match } from '../src/matches/entities/match.entity';
import { FootballApiService } from '../src/football-api/football-api.service';

describe('Teams (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Team, Match],
          synchronize: true,
        }),
        TeamsModule,
      ],
    })
      .overrideProvider(FootballApiService)
      .useValue({})
      .compile();

    app = (await moduleBuilder).createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /teams -> GET /teams/:id/db returns persisted team', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'Persisted FC', shortCode: 'PFC' })
      .expect(201);

    expect(createRes.body).toHaveProperty('id');
    const id = createRes.body.id;

    const getRes = await request(app.getHttpServer()).get(`/teams/${id}/db`).expect(200);
    expect(getRes.body).toMatchObject({ id, name: 'Persisted FC' });
  });
});
