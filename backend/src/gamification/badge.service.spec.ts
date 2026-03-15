import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadgeService } from './badge.service';
import { Badge, BadgeCriteriaType, BadgeTier } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserPrediction } from './entities/user-prediction.entity';
import { Comment } from '../social/entities/comment.entity';
import { Follow } from '../social/entities/follow.entity';
import { User } from '../users/user.entity';
import { AlertsService } from '../social/services/alerts.service';

describe('BadgeService', () => {
  let service: BadgeService;
  let badgeRepo: Repository<Badge>;
  let userBadgeRepo: Repository<UserBadge>;
  let alertsService: AlertsService;

  const mockBadge: Badge = {
    id: 1,
    name: 'First Blood',
    description: 'First prediction',
    iconUrl: 'icon.png',
    slug: 'first-blood',
    tier: BadgeTier.BRONZE,
    criteriaType: BadgeCriteriaType.FIRST_PREDICTION,
    threshold: 1,
    sortOrder: 1,
    isActive: true,
    userBadges: [],
    createdAt: new Date(),
  };

  const mockUserBadge: UserBadge = {
    id: 1,
    userId: 1,
    badgeId: 1,
    badge: mockBadge,
    user: {} as any,
    unlockedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            find: jest.fn().mockResolvedValue([mockBadge]),
          },
        },
        {
          provide: getRepositoryToken(UserBadge),
          useValue: {
            find: jest.fn().mockResolvedValue([mockUserBadge]),
            create: jest.fn().mockReturnValue(mockUserBadge),
            save: jest.fn().mockResolvedValue(mockUserBadge),
          },
        },
        {
          provide: getRepositoryToken(UserPrediction),
          useValue: {
            count: jest.fn().mockResolvedValue(10),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            count: jest.fn().mockResolvedValue(5),
          },
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: {
            count: jest.fn().mockResolvedValue(2),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn().mockResolvedValue({ id: 1, isPro: false }),
            findOne: jest.fn().mockResolvedValue({ id: 1, isPro: false }),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            createAlert: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
    badgeRepo = module.get<Repository<Badge>>(getRepositoryToken(Badge));
    userBadgeRepo = module.get<Repository<UserBadge>>(getRepositoryToken(UserBadge));
    alertsService = module.get<AlertsService>(AlertsService);
  });

  describe('getAllBadges', () => {
    it('should return all active badges with unlock status', async () => {
      const result = await service.getAllBadges(1);
      expect(result.length).toBe(1);
      expect(result[0].unlocked).toBe(true);
      expect(badgeRepo.find).toHaveBeenCalled();
    });

    it('should return badges as locked if userId not provided', async () => {
      const result = await service.getAllBadges();
      expect(result[0].unlocked).toBe(false);
    });
  });

  describe('getUserBadges', () => {
    it('should return only badges unlocked by user', async () => {
      const result = await service.getUserBadges(1);
      expect(result.length).toBe(1);
      expect(result[0].unlocked).toBe(true);
      expect(userBadgeRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
    });
  });

  describe('checkAndAward', () => {
    it('should award badge if criteria met and not already unlocked', async () => {
      // Setup: badge not unlocked yet
      (userBadgeRepo.find as jest.Mock).mockResolvedValue([]);
      
      // Force FIRST_PREDICTION criteria to be met
      // mockBadge has threshold 1 and type FIRST_PREDICTION
      const result = await service.checkAndAward(1, BadgeCriteriaType.FIRST_PREDICTION);
      
      expect(userBadgeRepo.save).toHaveBeenCalled();
      expect(alertsService.createAlert).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('First Blood');
    });

    it('should not award if already unlocked', async () => {
      (userBadgeRepo.find as jest.Mock).mockResolvedValue([{ badgeId: 1 }]);
      
      const result = await service.checkAndAward(1, BadgeCriteriaType.FIRST_PREDICTION);
      
      expect(userBadgeRepo.save).not.toHaveBeenCalled();
      expect(result.length).toBe(0);
    });

    it('should fall back to all active badges if eventType not provided', async () => {
      (userBadgeRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.checkAndAward(1);
      expect(result.length).toBe(1);
      expect(userBadgeRepo.save).toHaveBeenCalled();
    });
  });

  describe('isCriteriaMet logic branches', () => {
    const testCriteria = async (type: BadgeCriteriaType) => {
      const customBadge = { ...mockBadge, criteriaType: type, threshold: 1, id: 99, slug: 'test' };
      (badgeRepo.find as jest.Mock).mockResolvedValueOnce([customBadge]);
      (userBadgeRepo.find as jest.Mock).mockResolvedValueOnce([]);

      return await service.checkAndAward(1, type);
    };

    it('handles PREDICTIONS_CORRECT', async () => {
      const result = await testCriteria(BadgeCriteriaType.PREDICTIONS_CORRECT);
      expect(result.length).toBe(1);
    });

    it('handles PREDICTIONS_EXACT', async () => {
      const result = await testCriteria(BadgeCriteriaType.PREDICTIONS_EXACT);
      expect(result.length).toBe(1);
    });

    it('handles FIRST_PREDICTION', async () => {
      const result = await testCriteria(BadgeCriteriaType.FIRST_PREDICTION);
      expect(result.length).toBe(1);
    });

    it('handles COMMENTS_TOTAL', async () => {
      const result = await testCriteria(BadgeCriteriaType.COMMENTS_TOTAL);
      expect(result.length).toBe(1);
    });

    it('handles FOLLOWERS_COUNT', async () => {
      const result = await testCriteria(BadgeCriteriaType.FOLLOWERS_COUNT);
      expect(result.length).toBe(1);
    });

    it('handles FOLLOWING_COUNT', async () => {
      const result = await testCriteria(BadgeCriteriaType.FOLLOWING_COUNT);
      expect(result.length).toBe(1);
    });

    it('returns false for unknown criteria type', async () => {
      const result = await testCriteria(BadgeCriteriaType.PRO_SUBSCRIBER);
      expect(result.length).toBe(0);
    });
  });
});
