import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { FeedService } from '../services/feed.service';
import { FeedType } from '../dto/activity.dto';

describe('FeedController', () => {
  let controller: FeedController;

  const mockFeedService = {
    getUserFeed: jest.fn(),
    getGlobalFeed: jest.fn(),
    getMatchFeed: jest.fn(),
    getUserActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [{ provide: FeedService, useValue: mockFeedService }],
    }).compile();

    controller = module.get<FeedController>(FeedController);
    jest.clearAllMocks();
  });

  it('routes to global feed when feedType=GLOBAL', async () => {
    mockFeedService.getGlobalFeed.mockResolvedValue({ activities: [], total: 0 });

    const result = await controller.getUserFeed(
      { user: { sub: 1 } } as any,
      { feedType: FeedType.GLOBAL, page: 1, limit: 20 } as any,
    );

    expect(mockFeedService.getGlobalFeed).toHaveBeenCalled();
    expect(mockFeedService.getUserFeed).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('routes to personalized user feed by default', async () => {
    mockFeedService.getUserFeed.mockResolvedValue({ activities: [], total: 0 });

    const result = await controller.getUserFeed(
      { user: { sub: 9 } } as any,
      { page: 1, limit: 10 } as any,
    );

    expect(mockFeedService.getUserFeed).toHaveBeenCalledWith(9, {
      page: 1,
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it('returns global feed endpoint payload', async () => {
    mockFeedService.getGlobalFeed.mockResolvedValue({ activities: [{ id: 1 }], total: 1 });

    const result = await controller.getGlobalFeed({ page: 2 } as any);

    expect(mockFeedService.getGlobalFeed).toHaveBeenCalledWith({ page: 2 });
    expect(result.total).toBe(1);
  });

  it('returns match feed for parsed match id', async () => {
    mockFeedService.getMatchFeed.mockResolvedValue({ activities: [], total: 0 });

    await controller.getMatchFeed('42', { page: 1 } as any);

    expect(mockFeedService.getMatchFeed).toHaveBeenCalledWith(42, { page: 1 });
  });

  it('returns user activity feed for parsed user id', async () => {
    mockFeedService.getUserActivity.mockResolvedValue({ activities: [], total: 0 });

    await controller.getUserActivity('77', { limit: 5 } as any);

    expect(mockFeedService.getUserActivity).toHaveBeenCalledWith(77, { limit: 5 });
  });
});
