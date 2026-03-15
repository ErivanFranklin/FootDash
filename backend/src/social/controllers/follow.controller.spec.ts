import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from './follow.controller';
import { FollowService } from '../services/follow.service';

describe('FollowController', () => {
  let controller: FollowController;

  const mockFollowService = {
    followUser: jest.fn(),
    toResponseDto: jest.fn(),
    unfollowUser: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    getFollowStats: jest.fn(),
    isFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [{ provide: FollowService, useValue: mockFollowService }],
    }).compile();

    controller = module.get<FollowController>(FollowController);
    jest.clearAllMocks();
  });

  it('follows user and maps response dto', async () => {
    mockFollowService.followUser.mockResolvedValue({ id: 1 });
    mockFollowService.toResponseDto.mockReturnValue({ id: 1, followerId: 9 });

    const result = await controller.followUser(
      { user: { sub: 9 } } as any,
      { followingId: 12 } as any,
    );

    expect(mockFollowService.followUser).toHaveBeenCalledWith(9, { followingId: 12 });
    expect(result).toEqual({ success: true, follow: { id: 1, followerId: 9 } });
  });

  it('unfollows user by parsed param id', async () => {
    const result = await controller.unfollowUser({ user: { sub: 1 } } as any, '42');

    expect(mockFollowService.unfollowUser).toHaveBeenCalledWith(1, 42);
    expect(result.success).toBe(true);
  });

  it('returns followers payload with success wrapper', async () => {
    mockFollowService.getFollowers.mockResolvedValue({ users: [], total: 0, page: 1, limit: 20, hasMore: false });

    const result = await controller.getFollowers('7', { page: 1, limit: 20 } as any);

    expect(mockFollowService.getFollowers).toHaveBeenCalledWith(7, { page: 1, limit: 20 });
    expect(result.success).toBe(true);
    expect(result.total).toBe(0);
  });

  it('returns following payload with success wrapper', async () => {
    mockFollowService.getFollowing.mockResolvedValue({ users: [{ id: 1 }], total: 1, page: 1, limit: 20, hasMore: false });

    const result = await controller.getFollowing('7', { page: 1, limit: 20 } as any);

    expect(mockFollowService.getFollowing).toHaveBeenCalledWith(7, { page: 1, limit: 20 });
    expect(result.users.length).toBe(1);
  });

  it('returns stats with current user id when available', async () => {
    mockFollowService.getFollowStats.mockResolvedValue({ userId: 8, followersCount: 1, followingCount: 2, isFollowing: true });

    const result = await controller.getFollowStats({ user: { sub: 99 } } as any, '8');

    expect(mockFollowService.getFollowStats).toHaveBeenCalledWith(99, 8);
    expect(result.success).toBe(true);
  });

  it('returns stats with null current user when request has no user', async () => {
    mockFollowService.getFollowStats.mockResolvedValue({ userId: 8, followersCount: 1, followingCount: 2, isFollowing: false });

    await controller.getFollowStats({} as any, '8');

    expect(mockFollowService.getFollowStats).toHaveBeenCalledWith(null, 8);
  });

  it('checks following relation using parsed route param', async () => {
    mockFollowService.isFollowing.mockResolvedValue(true);

    const result = await controller.checkFollowing({ user: { sub: 5 } } as any, '10');

    expect(mockFollowService.isFollowing).toHaveBeenCalledWith(5, 10);
    expect(result).toEqual({ success: true, isFollowing: true });
  });
});
