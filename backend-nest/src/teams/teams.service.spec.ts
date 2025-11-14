import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { FootballApiService } from '../football-api/football-api.service';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';

const mockFootballApi = {
  getTeamInfo: jest.fn(),
  getTeamStats: jest.fn(),
  getTeamFixtures: jest.fn(),
};

const mockRepo = {
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
  findOne: jest.fn((opts) =>
    Promise.resolve({ id: opts.where.id, name: 'Saved' }),
  ),
};

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: FootballApiService, useValue: mockFootballApi },
        { provide: getRepositoryToken(Team), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  it('delegates getTeamOverview to FootballApiService', async () => {
    mockFootballApi.getTeamInfo.mockResolvedValue('team-info');
    const result = await service.getTeamOverview(39);
    expect(mockFootballApi.getTeamInfo).toHaveBeenCalledWith(39);
    expect(result).toBe('team-info');
  });

  it('throws when stats query params missing', async () => {
    expect(() => service.getTeamStats(1, {} as any)).toThrow(
      BadRequestException,
    );
  });

  it('delegates getTeamStats when params provided', async () => {
    mockFootballApi.getTeamStats.mockResolvedValue('stats');
    const result = await service.getTeamStats(10, {
      leagueId: 39,
      season: 2024,
    });
    expect(mockFootballApi.getTeamStats).toHaveBeenCalledWith({
      leagueId: 39,
      season: 2024,
      teamId: 10,
    });
    expect(result).toBe('stats');
  });

  it('delegates getTeamFixtures', async () => {
    mockFootballApi.getTeamFixtures.mockResolvedValue('fixtures');
    const result = await service.getTeamFixtures(10, { next: 5 });
    expect(mockFootballApi.getTeamFixtures).toHaveBeenCalledWith({
      teamId: 10,
      next: 5,
      season: undefined,
      last: undefined,
      status: undefined,
    });
    expect(result).toBe('fixtures');
  });

  it('allows getTeamStats when mock mode and missing leagueId', async () => {
  // Simulate FootballApiService running in mock mode
  (mockFootballApi as any).isMockMode = jest.fn(() => true);
    mockFootballApi.getTeamStats.mockResolvedValue('mock-stats');

    const result = await service.getTeamStats(10, { season: 2024 } as any);

    expect(mockFootballApi.getTeamStats).toHaveBeenCalledWith({
      leagueId: 999,
      season: 2024,
      teamId: 10,
    });
    expect(result).toBe('mock-stats');
  });

  it('creates and finds persisted team via repository', async () => {
    const created = await service.createTeam({
      name: 'X',
      shortCode: 'X1',
    } as any);
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
    expect(created.id).toBe(1);

    const found = await service.findTeamById(1);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(found).toMatchObject({ id: 1 });
  });
});
