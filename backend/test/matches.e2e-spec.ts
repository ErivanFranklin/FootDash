import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TeamsModule } from '../src/teams/teams.module';
import { MatchesModule } from '../src/matches/matches.module';
import { Team } from '../src/teams/entities/team.entity';
import { Match } from '../src/matches/entities/match.entity';
import { FootballApiService } from '../src/football-api/football-api.service';

describe('Matches (e2e)', () => {
  let app: INestApplication;
  const mockApi = {
    getTeamFixtures: jest.fn().mockResolvedValue([
      {
        id: 1,
        date: new Date().toISOString(),
        referee: 'Ref Name',
        venue: { id: 555, name: 'Stadium', city: 'City', capacity: 20000 },
        league: { id: 100, name: 'Premier', country: 'Country', season: 2025 },
        home: { id: 10, name: 'Home' },
        away: { id: 11, name: 'Away' },
      },
    ]),
  } as Partial<FootballApiService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
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
    const res = await request(app.getHttpServer())
      .get('/matches/team/10')
      .expect(200);
    expect(mockApi.getTeamFixtures).toHaveBeenCalled();
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /matches/team/:teamId/sync persists fixtures and returns saved matches', async () => {
    const res = await request(app.getHttpServer())
      .post('/matches/team/10/sync')
      .expect(201);
    expect(mockApi.getTeamFixtures).toHaveBeenCalled();
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('homeTeam');
    expect(res.body[0]).toHaveProperty('awayTeam');
    // new metadata persisted
    expect(res.body[0]).toHaveProperty('referee');
    expect(res.body[0]).toHaveProperty('venue');
    expect(res.body[0]).toHaveProperty('league');
  });
});
