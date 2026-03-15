import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

const mockTeamsService = {
  findAllTeams: jest.fn(),
  findTeamById: jest.fn(),
  getTeamOverview: jest.fn(),
  getTeamStats: jest.fn(),
  getTeamFixtures: jest.fn(),
  createTeam: jest.fn(),
  syncTeamFromApi: jest.fn(),
};

describe('TeamsController', () => {
  let controller: TeamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: mockTeamsService }],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    jest.clearAllMocks();
  });

  it('returns team overview', async () => {
    mockTeamsService.findTeamById.mockResolvedValue(undefined);
    mockTeamsService.getTeamOverview.mockResolvedValue('overview');
    const result = await controller.getTeamOverview({ teamId: 7 });
    expect(mockTeamsService.findTeamById).toHaveBeenCalledWith(7);
    expect(mockTeamsService.getTeamOverview).toHaveBeenCalledWith(7);
    expect(result).toBe('overview');
  });

  it('returns db team when available in getTeamOverview', async () => {
    mockTeamsService.findTeamById.mockResolvedValue({ id: 7, name: 'DB Team' });

    const result = await controller.getTeamOverview({ teamId: 7 });

    expect(mockTeamsService.getTeamOverview).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 7, name: 'DB Team' });
  });

  it('normalizes getAllTeams query params and delegates', async () => {
    mockTeamsService.findAllTeams.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    await controller.getAllTeams('0', '999', 'ars');

    expect(mockTeamsService.findAllTeams).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      search: 'ars',
    });
  });

  it('returns team stats', async () => {
    mockTeamsService.getTeamStats.mockResolvedValue('stats');
    const result = await controller.getTeamStats(
      { teamId: 7 },
      {
        leagueId: 39,
        season: 2024,
      },
    );
    expect(mockTeamsService.getTeamStats).toHaveBeenCalledWith(7, {
      leagueId: 39,
      season: 2024,
    });
    expect(result).toBe('stats');
  });

  it('returns team fixtures', async () => {
    mockTeamsService.getTeamFixtures.mockResolvedValue('fixtures');
    const result = await controller.getTeamFixtures({ teamId: 7 }, { next: 5 });
    expect(mockTeamsService.getTeamFixtures).toHaveBeenCalledWith(7, {
      next: 5,
    });
    expect(result).toBe('fixtures');
  });

  it('creates team via service', async () => {
    mockTeamsService.createTeam.mockResolvedValue({ id: 1, name: 'Created' });

    const result = await controller.createTeam({ name: 'Created' } as any);

    expect(mockTeamsService.createTeam).toHaveBeenCalledWith({ name: 'Created' });
    expect(result).toEqual({ id: 1, name: 'Created' });
  });

  it('syncTeam returns not-found message when externalId is missing', async () => {
    mockTeamsService.findTeamById.mockResolvedValue({ id: 10 });

    const result = await controller.syncTeam({ teamId: 10 });

    expect(mockTeamsService.syncTeamFromApi).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Team not found or has no external ID',
      teamId: 10,
    });
  });

  it('syncTeam delegates to service when externalId exists', async () => {
    mockTeamsService.findTeamById.mockResolvedValue({ id: 11, externalId: 101 });
    mockTeamsService.syncTeamFromApi.mockResolvedValue({ id: 11, name: 'Synced' });

    const result = await controller.syncTeam({ teamId: 11 });

    expect(mockTeamsService.syncTeamFromApi).toHaveBeenCalledWith(101);
    expect(result).toEqual({
      message: 'Team synced successfully',
      team: { id: 11, name: 'Synced' },
    });
  });

  it('getPersistedTeam delegates findTeamById', async () => {
    mockTeamsService.findTeamById.mockResolvedValue({ id: 4, name: 'Persisted' });

    const result = await controller.getPersistedTeam({ teamId: 4 });

    expect(mockTeamsService.findTeamById).toHaveBeenCalledWith(4);
    expect(result).toEqual({ id: 4, name: 'Persisted' });
  });
});
