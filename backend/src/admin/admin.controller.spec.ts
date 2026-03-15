import { Test, TestingModule } from '@nestjs/testing';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AdminController', () => {
  let controller: AdminController;

  const adminServiceMock = {
    getDashboardStats: jest.fn(),
    listUsers: jest.fn(),
    updateUserRole: jest.fn(),
    updateUserPro: jest.fn(),
  };

  const analyticsServiceMock = {
    getRegistrationTrend: jest.fn(),
    getActiveUsers: jest.fn(),
    getPredictionAccuracy: jest.fn(),
    getGrowthMetrics: jest.fn(),
    getRoleDistribution: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: AdminAnalyticsService, useValue: analyticsServiceMock },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  it('returns dashboard stats', async () => {
    adminServiceMock.getDashboardStats.mockResolvedValue({ totalUsers: 1 });

    await expect(controller.getStats()).resolves.toEqual({ totalUsers: 1 });
  });

  it('parses listUsers query inputs and delegates', async () => {
    adminServiceMock.listUsers.mockResolvedValue({ items: [] });

    await controller.listUsers('25', '10', 'john', 'admin', 'true');

    expect(adminServiceMock.listUsers).toHaveBeenCalledWith(
      25,
      10,
      'john',
      'ADMIN',
      true,
    );
  });

  it('uses listUsers defaults for invalid role/isPro/limits', async () => {
    adminServiceMock.listUsers.mockResolvedValue({ items: [] });

    await controller.listUsers('nope', 'bad', undefined, 'owner', 'maybe');

    expect(adminServiceMock.listUsers).toHaveBeenCalledWith(
      50,
      0,
      undefined,
      undefined,
      undefined,
    );
  });

  it('updates role and pro flags', async () => {
    adminServiceMock.updateUserRole.mockResolvedValue({ id: 1, role: 'ADMIN' });
    adminServiceMock.updateUserPro.mockResolvedValue({ id: 1, isPro: true });

    await expect(
      controller.updateUserRole(1, { role: 'ADMIN' } as any),
    ).resolves.toEqual({ id: 1, role: 'ADMIN' });
    await expect(
      controller.updateUserPro(1, { isPro: true } as any),
    ).resolves.toEqual({ id: 1, isPro: true });
  });

  it('uses default days for analytics endpoints', async () => {
    analyticsServiceMock.getRegistrationTrend.mockResolvedValue([]);
    analyticsServiceMock.getActiveUsers.mockResolvedValue([]);

    await controller.getRegistrationTrend('bad');
    await controller.getActiveUsers(undefined);

    expect(analyticsServiceMock.getRegistrationTrend).toHaveBeenCalledWith(30);
    expect(analyticsServiceMock.getActiveUsers).toHaveBeenCalledWith(30);
  });

  it('delegates analytics passthrough endpoints', async () => {
    analyticsServiceMock.getPredictionAccuracy.mockResolvedValue({});
    analyticsServiceMock.getGrowthMetrics.mockResolvedValue({});
    analyticsServiceMock.getRoleDistribution.mockResolvedValue({});

    await expect(controller.getPredictionAccuracy()).resolves.toEqual({});
    await expect(controller.getGrowthMetrics()).resolves.toEqual({});
    await expect(controller.getRoleDistribution()).resolves.toEqual({});
  });
});