import { Test, TestingModule } from '@nestjs/testing';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const dashboardServiceMock = {
    getPersonalizedDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardServiceMock }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    jest.clearAllMocks();
  });

  it('delegates dashboard fetch to service', async () => {
    dashboardServiceMock.getPersonalizedDashboard.mockResolvedValue({ sections: [] });

    await expect(controller.getDashboard({ sub: 2 })).resolves.toEqual({
      sections: [],
    });
    expect(dashboardServiceMock.getPersonalizedDashboard).toHaveBeenCalledWith(2);
  });
});
