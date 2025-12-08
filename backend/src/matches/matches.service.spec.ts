import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { FootballApiService } from '../football-api/football-api.service';
import { MatchRangeType } from './dto/matches-query.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { MatchGateway } from '../websockets/match.gateway';
import { NotificationsService } from '../notifications/notifications.service';

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
};

const mockTeamRepo = {
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ id: 100, ...v })),
  findOne: jest.fn(() => undefined),
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
});
