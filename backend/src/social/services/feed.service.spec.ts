import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import {
  UserActivity,
  ActivityTargetType,
} from '../entities/user-activity.entity';
import { Follow } from '../entities/follow.entity';

const createMockQB = (results: any[], total = results.length) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([results, total]),
});

const mockActivityRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockFollowRepo = () => ({
  find: jest.fn(),
});

describe('FeedService', () => {
  let service: FeedService;
  let activityRepo: ReturnType<typeof mockActivityRepo>;
  let followRepo: ReturnType<typeof mockFollowRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(UserActivity),
          useFactory: mockActivityRepo,
        },
        { provide: getRepositoryToken(Follow), useFactory: mockFollowRepo },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    activityRepo = module.get(getRepositoryToken(UserActivity));
    followRepo = module.get(getRepositoryToken(Follow));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserFeed', () => {
    it('returns paginated activities for the user and follows', async () => {
      followRepo.find.mockResolvedValue([
        { followingId: 2 },
        { followingId: 3 },
      ]);
      const mockActivity = {
        id: 1,
        userId: 2,
        activityType: 'PREDICTION',
        targetType: ActivityTargetType.MATCH,
        targetId: 5,
        metadata: {},
        createdAt: new Date(),
        user: { email: 'user@example.com' },
      };
      const mockQB = createMockQB([mockActivity], 1);
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getUserFeed(1, {
        page: 1,
        limit: 20,
      } as any);

      expect(followRepo.find).toHaveBeenCalledWith({
        where: { followerId: 1 },
        select: ['followingId'],
      });
      expect(result.total).toBe(1);
      expect(result.activities).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty feed when user follows nobody', async () => {
      followRepo.find.mockResolvedValue([]);
      const mockQB = createMockQB([], 0);
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getUserFeed(99, {
        page: 1,
        limit: 20,
      } as any);

      expect(result.total).toBe(0);
      expect(result.activities).toHaveLength(0);
    });

    it('calculates hasMore correctly when there are more pages', async () => {
      followRepo.find.mockResolvedValue([]);
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        userId: 1,
        activityType: 'PREDICTION',
        targetType: ActivityTargetType.MATCH,
        targetId: i,
        metadata: {},
        createdAt: new Date(),
        user: { email: 'u@e.com' },
      }));
      const mockQB = createMockQB(items, 25); // 25 total, 10 returned
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getUserFeed(1, {
        page: 1,
        limit: 10,
      } as any);

      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(25);
    });

    it('applies an activity type filter when provided', async () => {
      followRepo.find.mockResolvedValue([{ followingId: 2 }]);
      const mockQB = createMockQB([], 0);
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getUserFeed(1, {
        activityType: 'COMMENT',
      } as any);

      expect(mockQB.where).toHaveBeenCalledWith(
        'activity.userId IN (:...userIds)',
        { userIds: [2, 1] },
      );
      expect(mockQB.andWhere).toHaveBeenCalledWith(
        'activity.activityType = :activityType',
        { activityType: 'COMMENT' },
      );
    });
  });

  describe('getGlobalFeed', () => {
    it('returns paginated global activity results', async () => {
      const mockQB = createMockQB(
        [
          {
            id: 7,
            userId: 2,
            activityType: 'FOLLOW',
            targetType: ActivityTargetType.USER,
            targetId: 5,
            metadata: { targetName: 'Someone' },
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            user: { email: 'global@example.com' },
          },
        ],
        4,
      );
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getGlobalFeed({ page: 1, limit: 1 } as any);

      expect(mockQB.orderBy).toHaveBeenCalledWith('activity.createdAt', 'DESC');
      expect(result.total).toBe(4);
      expect(result.hasMore).toBe(true);
      expect(result.activities[0].userName).toBe('global@example.com');
    });

    it('uses where when global feed is filtered by activity type', async () => {
      const mockQB = createMockQB([], 0);
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getGlobalFeed({ activityType: 'REACTION' } as any);

      expect(mockQB.where).toHaveBeenCalledWith(
        'activity.activityType = :activityType',
        { activityType: 'REACTION' },
      );
    });
  });

  describe('getMatchFeed', () => {
    it('filters by match target and optional activity type', async () => {
      const mockQB = createMockQB([], 0);
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      await service.getMatchFeed(12, { activityType: 'COMMENT' } as any);

      expect(mockQB.where).toHaveBeenCalledWith(
        'activity.targetType = :targetType',
        { targetType: ActivityTargetType.MATCH },
      );
      expect(mockQB.andWhere).toHaveBeenCalledWith(
        'activity.targetId = :matchId',
        { matchId: 12 },
      );
      expect(mockQB.andWhere).toHaveBeenLastCalledWith(
        'activity.activityType = :activityType',
        { activityType: 'COMMENT' },
      );
    });
  });

  describe('getUserActivity', () => {
    it('returns paginated activity for a specific user', async () => {
      const mockQB = createMockQB(
        [
          {
            id: 9,
            userId: 4,
            activityType: 'PREDICTION',
            targetType: ActivityTargetType.MATCH,
            targetId: 6,
            metadata: { content: 'Hot take' },
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            user: { email: 'user@example.com' },
          },
        ],
        1,
      );
      activityRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getUserActivity(4, { page: 2, limit: 5 } as any);

      expect(mockQB.where).toHaveBeenCalledWith('activity.userId = :userId', {
        userId: 4,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.activities[0].content).toBe('Hot take');
    });
  });

  describe('addActivity', () => {
    it('creates and saves a new activity', async () => {
      const dto = {
        userId: 1,
        activityType: 'COMMENT' as any,
        targetType: ActivityTargetType.MATCH,
        targetId: 10,
        metadata: { content: 'Great match!' },
      };
      const saved = { id: 1, ...dto, createdAt: new Date() };
      activityRepo.create.mockReturnValue(dto);
      activityRepo.save.mockResolvedValue(saved);

      const result = await service.addActivity(dto);

      expect(activityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, targetId: 10 }),
      );
      expect(result.id).toBe(1);
    });
  });

  describe('deleteActivitiesByTarget', () => {
    it('deletes activities by targetType and targetId', async () => {
      activityRepo.delete.mockResolvedValue({ affected: 3 });

      await service.deleteActivitiesByTarget(ActivityTargetType.MATCH, 5);

      expect(activityRepo.delete).toHaveBeenCalledWith({
        targetType: ActivityTargetType.MATCH,
        targetId: 5,
      });
    });
  });

  describe('toResponseDto', () => {
    it('maps an activity to a response DTO', () => {
      const activity: Partial<UserActivity> = {
        id: 1,
        userId: 2,
        activityType: 'PREDICTION' as any,
        targetType: ActivityTargetType.MATCH,
        targetId: 3,
        metadata: { content: 'Nice' },
        createdAt: new Date('2026-01-01'),
        user: { email: 'test@test.com' } as any,
      };

      const dto = service.toResponseDto(activity as UserActivity);

      expect(dto.userId).toBe(2);
      expect(dto.userName).toBe('test@test.com');
      expect(dto.content).toBe('Nice');
    });

    it('falls back to "Unknown" for missing user', () => {
      const activity: Partial<UserActivity> = {
        id: 2,
        userId: 3,
        activityType: 'PREDICTION' as any,
        targetType: ActivityTargetType.MATCH,
        targetId: 1,
        metadata: {},
        createdAt: new Date(),
        user: undefined,
      };
      const dto = service.toResponseDto(activity as UserActivity);
      expect(dto.userName).toBe('Unknown');
    });

    it('includes optional metadata fields when present', () => {
      const activity: Partial<UserActivity> = {
        id: 3,
        userId: 6,
        activityType: 'FOLLOW' as any,
        targetType: ActivityTargetType.USER,
        targetId: 2,
        metadata: { targetName: 'Target User', content: 'followed' },
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        user: { email: 'meta@test.com' } as any,
      };

      const dto = service.toResponseDto(activity as UserActivity);

      expect(dto.targetName).toBe('Target User');
      expect(dto.content).toBe('followed');
    });
  });
});
