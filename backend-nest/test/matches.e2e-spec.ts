import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../src/teams/teams.module';
import { MatchesModule } from '../src/matches/matches.module';
import { Team } from '../src/teams/entities/team.entity';
import { Match } from '../src/matches/entities/match.entity';
import { FootballApiService } from '../src/football-api/football-api.service';

describe('Matches (e2e)', () => {
  let app: INestApplication;
  const mockApi = {
    getTeamFixtures: jest.fn().mockResolvedValue([{ id: 1, home: { id: 10, name: 'Home' }, away: { id: 11, name: 'Away' } }]),
  } as Partial<FootballApiService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Team, Match],
          synchronize: true,
        }),
        TeamsModule,
        MatchesModule,
      ],
    })
      .overrideProvider(FootballApiService)
      .useValue(mockApi)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/matches/team/:teamId (GET) returns fixtures (mocked)', async () => {
    const res = await request(app.getHttpServer()).get('/matches/team/10').expect(200);
    expect(mockApi.getTeamFixtures).toHaveBeenCalled();
    expect(Array.isArray(res.body)).toBe(true);
  });
});
