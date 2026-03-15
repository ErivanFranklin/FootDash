import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { FootballApiService } from '../football-api/football-api.service';
import {
  createMockedFootballApi,
  createMockRepo,
} from '../../test/utils/mocks';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { ConfigService } from '@nestjs/config';

// Keep the mock flexible for Jest helpers; the adapter interface exists in
// src/football-api/football-api-adapter.interface.ts for stricter typing
// elsewhere. Here we use `any` to simplify mocking helpers like
// `mockResolvedValue` without verbose casts.
const mockFootballApi = createMockedFootballApi();
const mockRepo = createMockRepo();

describe('TeamsService', () => {
  let service: TeamsService;
  let configMock: { get: jest.Mock };

  beforeEach(async () => {
    configMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: FootballApiService, useValue: mockFootballApi },
        { provide: getRepositoryToken(Team), useValue: mockRepo },
        { provide: ConfigService, useValue: configMock },
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

  it('uses default league from config when query omits leagueId', async () => {
    configMock.get.mockReturnValue('39');
    mockFootballApi.getTeamStats.mockResolvedValue('stats');

    const result = await service.getTeamStats(11, {
      season: 2024,
    } as any);

    expect(mockFootballApi.getTeamStats).toHaveBeenCalledWith({
      leagueId: 39,
      season: 2024,
      teamId: 11,
    });
    expect(result).toBe('stats');
  });

  it('allows missing season in mock mode and falls back league to 999', async () => {
    (mockFootballApi as any).isMockMode = jest.fn(() => true);
    mockFootballApi.getTeamStats.mockResolvedValue('mock-stats');

    const result = await service.getTeamStats(12, {} as any);

    expect(mockFootballApi.getTeamStats).toHaveBeenCalledWith({
      leagueId: 999,
      season: undefined,
      teamId: 12,
    });
    expect(result).toBe('mock-stats');
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

  it('returns paginated teams and applies search filter', async () => {
    const qb = {
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[{ id: 2, name: 'Arsenal' }], 1]),
    };
    mockRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAllTeams({
      page: 2,
      limit: 10,
      search: 'ARS',
    });

    expect(qb.orderBy).toHaveBeenCalledWith('team.name', 'ASC');
    expect(qb.where).toHaveBeenCalledWith('LOWER(team.name) LIKE :search', {
      search: '%ars%',
    });
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      data: [{ id: 2, name: 'Arsenal' }],
      total: 1,
      page: 2,
      limit: 10,
    });
  });

  it('syncs team from API by creating a new record when none exists', async () => {
    mockFootballApi.getTeamInfo.mockResolvedValue({
      team: { name: 'Team Name', shortCode: 'TN' },
    });
    (mockRepo.findOne as any).mockResolvedValue(null);
    mockRepo.create.mockReturnValue({
      externalId: 77,
      name: 'Team Name',
      shortCode: 'TN',
    });
    mockRepo.save.mockResolvedValue({ id: 77, name: 'Team Name' });

    const result = await service.syncTeamFromApi(77);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { externalId: 77 } });
    expect(mockRepo.create).toHaveBeenCalledWith({
      externalId: 77,
      name: 'Team Name',
      shortCode: 'TN',
    });
    expect(result).toEqual({ id: 77, name: 'Team Name' });
  });

  it('syncs team from API by updating an existing record', async () => {
    mockFootballApi.getTeamInfo.mockResolvedValue({
      team: { name: 'Updated Team', shortCode: 'UPD' },
    });
    const existing = { externalId: 88, name: 'Old Name', shortCode: 'OLD' };
    (mockRepo.findOne as any).mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue({ ...existing, name: 'Updated Team', shortCode: 'UPD' });

    const result = await service.syncTeamFromApi(88);

    expect(result).toMatchObject({ name: 'Updated Team', shortCode: 'UPD' });
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 88,
        name: 'Updated Team',
        shortCode: 'UPD',
      }),
    );
  });
});
