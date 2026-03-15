import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { FootballApiService } from '../football-api/football-api.service';
import { MatchRangeType } from './dto/matches-query.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { MatchGateway } from '../websockets/match.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const footballApiMock = {
  getTeamFixtures: jest.fn(),
};

const mockMatchGateway = {
  broadcastMatchUpdate: jest.fn(),
};

const mockNotificationsService = {
  sendMatchNotice: jest.fn(),
  registerToken: jest.fn(),
};

const mockMatchRepo = {
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve(v)),
  findOne: jest.fn(() => undefined),
  find: jest.fn(() => []),
};

const mockTeamRepo = {
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ id: 100, ...v })),
  findOne: jest.fn(() => undefined),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('MatchesService', () => {
  let service: MatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: FootballApiService, useValue: footballApiMock },
        { provide: getRepositoryToken(Match), useValue: mockMatchRepo },
        { provide: getRepositoryToken(Team), useValue: mockTeamRepo },
        { provide: MatchGateway, useValue: mockMatchGateway },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    jest.clearAllMocks();
  });

  it('requests recent matches with last parameter', async () => {
    footballApiMock.getTeamFixtures.mockResolvedValue('matches');
    await service.getTeamMatches(12, {
      range: MatchRangeType.RECENT,
      limit: 3,
      season: 2023,
    });

    expect(footballApiMock.getTeamFixtures).toHaveBeenCalledWith({
      teamId: 12,
      season: 2023,
      last: 3,
      next: undefined,
    });
  });

  it('requests upcoming matches with next parameter and default limit', async () => {
    footballApiMock.getTeamFixtures.mockResolvedValue('matches');
    await service.getTeamMatches(12, {
      range: MatchRangeType.UPCOMING,
    });

    expect(footballApiMock.getTeamFixtures).toHaveBeenCalledWith({
      teamId: 12,
      season: undefined,
      last: undefined,
      next: 5,
    });
  });

  it('requests all matches without last/next when range is ALL', async () => {
    footballApiMock.getTeamFixtures.mockResolvedValue('matches');
    await service.getTeamMatches(33, {
      range: MatchRangeType.ALL,
      season: 2025,
      from: '2025-02-26',
      to: '2025-02-26',
    });

    expect(footballApiMock.getTeamFixtures).toHaveBeenCalledWith({
      teamId: 33,
      season: 2025,
      last: undefined,
      next: undefined,
      from: '2025-02-26',
      to: '2025-02-26',
    });
  });

  it('passes through when no range provided', async () => {
    footballApiMock.getTeamFixtures.mockResolvedValue('matches');
    await service.getTeamMatches(1, { limit: 4 });

    expect(footballApiMock.getTeamFixtures).toHaveBeenCalledWith({
      teamId: 1,
      season: undefined,
      last: undefined,
      next: undefined,
    });
  });

  it('resolves external team id when a DB team mapping exists', async () => {
    (mockTeamRepo.findOne as any).mockResolvedValueOnce({
      id: 12,
      externalId: 712,
    });
    footballApiMock.getTeamFixtures.mockResolvedValue([]);

    await service.getTeamMatches(12, { range: MatchRangeType.ALL });

    expect(footballApiMock.getTeamFixtures).toHaveBeenCalledWith(
      expect.objectContaining({ teamId: 712 }),
    );
  });

  it('getMatch and getMatchesByDate delegate with expected query shape', async () => {
    await service.getMatch(99);
    expect(mockMatchRepo.findOne).toHaveBeenCalledWith({
      where: { id: 99 },
      relations: ['homeTeam', 'awayTeam'],
    });

    await service.getMatchesByDate('2026-03-15');
    expect(mockMatchRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['homeTeam', 'awayTeam'],
        order: { kickOff: 'ASC' },
      }),
    );
  });

  it('syncFixturesFromApi creates teams/match and broadcasts persisted match', async () => {
    jest.spyOn(service, 'getTeamMatches').mockResolvedValueOnce([
      {
        fixture: { id: 501, date: '2026-03-15T12:00:00.000Z' },
        teams: {
          home: { id: 11, name: 'Home FC' },
          away: { id: 12, name: 'Away FC' },
        },
        goals: { home: 2, away: 1 },
        league: { season: 2026 },
        status: { short: 'FT' },
      },
    ] as any);
    (mockTeamRepo.findOne as any).mockResolvedValue(null);
    mockTeamRepo.save
      .mockResolvedValueOnce({ id: 1, externalId: 11, name: 'Home FC' })
      .mockResolvedValueOnce({ id: 2, externalId: 12, name: 'Away FC' });
    (mockMatchRepo.findOne as any).mockResolvedValue(null);
    mockMatchRepo.save.mockResolvedValueOnce({ id: 77, externalId: 501 });

    const result = await service.syncFixturesFromApi(10, {
      season: 2026,
      range: MatchRangeType.ALL,
    });

    expect(mockTeamRepo.create).toHaveBeenCalledTimes(2);
    expect(mockMatchRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: 501, season: '2026' }),
    );
    expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(
      '77',
      expect.objectContaining({ id: 77 }),
    );
    expect(result).toEqual([{ id: 77, externalId: 501 }]);
  });

  it('syncFixturesFromApi updates existing match and emits start/goal notices', async () => {
    const existing = {
      id: 88,
      externalId: 601,
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
    } as any;

    jest.spyOn(service, 'getTeamMatches').mockResolvedValueOnce([
      {
        fixture: { id: 601, date: '2026-03-15T13:00:00.000Z' },
        teams: {
          home: { id: 21, name: 'Alpha' },
          away: { id: 22, name: 'Beta' },
        },
        goals: { home: 1, away: 0 },
        status: { short: 'IN_PLAY' },
        league: { season: 2026 },
      },
    ] as any);
    (mockTeamRepo.findOne as any)
      .mockResolvedValueOnce({ id: 11, externalId: 21, name: 'Alpha' })
      .mockResolvedValueOnce({ id: 12, externalId: 22, name: 'Beta' });
    (mockMatchRepo.findOne as any).mockResolvedValue(existing);
    mockMatchRepo.save.mockImplementation(async (v: any) => v);

    await service.syncFixturesFromApi(10, {
      season: 2026,
      range: MatchRangeType.ALL,
    });

    expect(mockMatchGateway.broadcastMatchUpdate).toHaveBeenCalledWith(
      '88',
      expect.objectContaining({ id: 88 }),
    );
    expect(mockNotificationsService.sendMatchNotice).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 88 }),
      'match-start',
      expect.any(String),
    );
    expect(mockNotificationsService.sendMatchNotice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 88 }),
      'goal',
      'Alpha scored! 1-0',
    );
  });

  it('syncFixturesFromApi emits finished event with result notice', async () => {
    const existing = {
      id: 89,
      externalId: 602,
      status: 'IN_PLAY',
      homeScore: 1,
      awayScore: 1,
    } as any;

    jest.spyOn(service, 'getTeamMatches').mockResolvedValueOnce([
      {
        fixture: { id: 602, date: '2026-03-15T14:00:00.000Z' },
        teams: {
          home: { id: 31, name: 'Gamma' },
          away: { id: 32, name: 'Delta' },
        },
        goals: { home: 3, away: 2 },
        status: { short: 'FINISHED' },
        league: { season: 2026 },
      },
    ] as any);
    (mockTeamRepo.findOne as any)
      .mockResolvedValueOnce({ id: 13, externalId: 31, name: 'Gamma' })
      .mockResolvedValueOnce({ id: 14, externalId: 32, name: 'Delta' });
    (mockMatchRepo.findOne as any).mockResolvedValue(existing);
    mockMatchRepo.save.mockImplementation(async (v: any) => v);

    await service.syncFixturesFromApi(10, {
      season: 2026,
      range: MatchRangeType.ALL,
    });

    expect(mockNotificationsService.sendMatchNotice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 89 }),
      'result',
      'Gamma 3 - 2 Delta (FT)',
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'match.finished',
      expect.objectContaining({ matchId: 89, homeScore: 3, awayScore: 2 }),
    );
  });
});
