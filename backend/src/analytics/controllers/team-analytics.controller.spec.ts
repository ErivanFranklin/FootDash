import { Test, TestingModule } from '@nestjs/testing';

import { TeamAnalyticsController } from './team-analytics.controller';
import { TeamAnalyticsService } from '../services/team-analytics.service';

describe('TeamAnalyticsController', () => {
  let controller: TeamAnalyticsController;

  const analyticsServiceMock = {
    compareTeams: jest.fn(),
    getTeamAnalytics: jest.fn(),
    getTeamForm: jest.fn(),
    refreshAllTeamAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamAnalyticsController],
      providers: [{ provide: TeamAnalyticsService, useValue: analyticsServiceMock }],
    }).compile();

    controller = module.get<TeamAnalyticsController>(TeamAnalyticsController);
    jest.clearAllMocks();
  });

  it('delegates compare and team analytics queries', async () => {
    analyticsServiceMock.compareTeams.mockResolvedValue({});
    analyticsServiceMock.getTeamAnalytics.mockResolvedValue({});

    await controller.compareTeams(1, 2, '2025');
    await controller.getTeamAnalytics(1, '2025');

    expect(analyticsServiceMock.compareTeams).toHaveBeenCalledWith(1, 2, '2025');
    expect(analyticsServiceMock.getTeamAnalytics).toHaveBeenCalledWith(1, '2025');
  });

  it('delegates form lookup with explicit lastN', async () => {
    analyticsServiceMock.getTeamForm.mockResolvedValue({});

    await controller.getTeamForm(10, 8);

    expect(analyticsServiceMock.getTeamForm).toHaveBeenCalledWith(10, 8);
  });

  it('returns refresh summary message', async () => {
    analyticsServiceMock.refreshAllTeamAnalytics.mockResolvedValue(14);

    await expect(controller.refreshAllAnalytics('2025')).resolves.toEqual({
      message: 'Refreshed analytics for 14 teams',
      count: 14,
    });
  });
});
