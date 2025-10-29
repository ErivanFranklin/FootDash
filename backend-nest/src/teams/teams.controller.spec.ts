import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

const mockTeamsService = {
  getTeamOverview: jest.fn(),
  getTeamStats: jest.fn(),
  getTeamFixtures: jest.fn(),
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
    mockTeamsService.getTeamOverview.mockResolvedValue('overview');
    const result = await controller.getTeamOverview({ teamId: 7 });
    expect(mockTeamsService.getTeamOverview).toHaveBeenCalledWith(7);
    expect(result).toBe('overview');
  });

  it('returns team stats', async () => {
    mockTeamsService.getTeamStats.mockResolvedValue('stats');
    const result = await controller.getTeamStats({ teamId: 7 }, {
      leagueId: 39,
      season: 2024,
    });
    expect(mockTeamsService.getTeamStats).toHaveBeenCalledWith(7, {
      leagueId: 39,
      season: 2024,
    });
    expect(result).toBe('stats');
  });

  it('returns team fixtures', async () => {
    mockTeamsService.getTeamFixtures.mockResolvedValue('fixtures');
    const result = await controller.getTeamFixtures({ teamId: 7 }, { next: 5 });
    expect(mockTeamsService.getTeamFixtures).toHaveBeenCalledWith(7, { next: 5 });
    expect(result).toBe('fixtures');
  });
});
