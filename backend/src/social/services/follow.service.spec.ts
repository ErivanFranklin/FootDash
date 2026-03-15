import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FollowService } from './follow.service';
import { Follow } from '../entities/follow.entity';
import { User } from '../../users/user.entity';
import { SocialGateway } from '../../websockets/social.gateway';

describe('FollowService', () => {
  let service: FollowService;

  const mockFollowRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockGateway = {
    broadcastGlobalEvent: jest.fn(),
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        { provide: getRepositoryToken(Follow), useValue: mockFollowRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: SocialGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    jest.clearAllMocks();
  });

  it('throws when trying to follow yourself', async () => {
    await expect(service.followUser(1, { followingId: 1 } as any)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws when target user does not exist', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(service.followUser(1, { followingId: 2 } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when already following target user', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 2 });
    mockFollowRepository.findOne.mockResolvedValue({ id: 99 });

    await expect(service.followUser(1, { followingId: 2 } as any)).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates follow, broadcasts event, and notifies followed user', async () => {
    const followEntity = {
      id: 10,
      followerId: 1,
      followingId: 2,
      createdAt: new Date(),
    };

    mockUserRepository.findOne.mockResolvedValue({ id: 2 });
    mockFollowRepository.findOne.mockResolvedValue(null);
    mockFollowRepository.create.mockReturnValue(followEntity);
    mockFollowRepository.save.mockResolvedValue(followEntity);
    jest.spyOn(service, 'getFollowStats').mockResolvedValueOnce({
      userId: 1,
      followersCount: 1,
      followingCount: 2,
      isFollowing: false,
    });
    jest.spyOn(service, 'getFollowStats').mockResolvedValueOnce({
      userId: 2,
      followersCount: 3,
      followingCount: 4,
      isFollowing: false,
    });

    const result = await service.followUser(1, { followingId: 2 } as any);

    expect(result).toEqual(followEntity);
    expect(mockGateway.broadcastGlobalEvent).toHaveBeenCalled();
    expect(mockGateway.emitToUser).toHaveBeenCalledWith(
      2,
      'new-follower',
      expect.objectContaining({ followerId: 1 }),
    );
  });

  it('throws when unfollow relationship does not exist', async () => {
    mockFollowRepository.findOne.mockResolvedValue(null);

    await expect(service.unfollowUser(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('removes follow relationship when it exists', async () => {
    const follow = { id: 50, followerId: 1, followingId: 2 };
    mockFollowRepository.findOne.mockResolvedValue(follow);

    const result = await service.unfollowUser(1, 2);

    expect(result).toBe(true);
    expect(mockFollowRepository.remove).toHaveBeenCalledWith(follow);
  });

  it('returns paginated followers list', async () => {
    const createdAt = new Date();
    mockFollowRepository.findAndCount.mockResolvedValue([
      [{ follower: { id: 8, email: 'u8@mail.com', createdAt } }],
      1,
    ]);

    const result = await service.getFollowers(2, { page: 1, limit: 20 } as any);

    expect(result.total).toBe(1);
    expect(result.users[0]).toEqual({
      id: 8,
      email: 'u8@mail.com',
      createdAt: createdAt.toISOString(),
    });
    expect(result.hasMore).toBe(false);
  });

  it('returns paginated following list', async () => {
    const createdAt = new Date();
    mockFollowRepository.findAndCount.mockResolvedValue([
      [{ following: { id: 11, email: 'u11@mail.com', createdAt } }],
      3,
    ]);

    const result = await service.getFollowing(2, { page: 1, limit: 1 } as any);

    expect(result.total).toBe(3);
    expect(result.users[0].id).toBe(11);
    expect(result.hasMore).toBe(true);
  });

  it('computes follow stats without current user', async () => {
    jest.spyOn(service, 'getFollowerCount').mockResolvedValue(7);
    jest.spyOn(service, 'getFollowingCount').mockResolvedValue(9);

    const result = await service.getFollowStats(null, 10);

    expect(result).toEqual({
      userId: 10,
      followersCount: 7,
      followingCount: 9,
      isFollowing: false,
    });
  });

  it('computes follow stats with current user following target', async () => {
    jest.spyOn(service, 'getFollowerCount').mockResolvedValue(2);
    jest.spyOn(service, 'getFollowingCount').mockResolvedValue(3);
    jest.spyOn(service, 'isFollowing').mockResolvedValue(true);

    const result = await service.getFollowStats(1, 2);

    expect(service.isFollowing).toHaveBeenCalledWith(1, 2);
    expect(result.isFollowing).toBe(true);
  });

  it('maps follow entity to response dto', () => {
    const createdAt = new Date();
    const dto = service.toResponseDto({
      id: 1,
      followerId: 5,
      followingId: 6,
      createdAt,
      follower: { email: 'follower@mail.com' },
      following: { email: 'following@mail.com' },
    } as any);

    expect(dto).toEqual({
      id: 1,
      followerId: 5,
      followingId: 6,
      followerName: 'follower@mail.com',
      followingName: 'following@mail.com',
      createdAt: createdAt.toISOString(),
    });
  });
});
