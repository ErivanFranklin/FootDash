import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminAnalyticsService } from './admin-analytics.service';
import { User } from '../users/user.entity';
import { UserActivity } from '../social/entities/user-activity.entity';
import { PredictionPerformance } from '../analytics/entities/prediction-performance.entity';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
    getCount: jest.fn().mockResolvedValue(0),
  };

  const mockRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(UserActivity), useValue: mockRepo },
        { provide: getRepositoryToken(PredictionPerformance), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRegistrationTrend', () => {
    it('should return trend with zeroed missing days', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { day: today, count: '5' }
      ]);

      const result = await service.getRegistrationTrend(2);
      // Expected 3 days (since, since+1, today)
      expect(result.length).toBeGreaterThanOrEqual(2);
      const todayEntry = result.find(r => r.date === today);
      expect(todayEntry?.count).toBe(5);
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users count per day', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { day: today, count: '10' }
      ]);

      const result = await service.getActiveUsers(1);
      const todayEntry = result.find(r => r.date === today);
      expect(todayEntry?.count).toBe(10);
    });
  });

  describe('getPredictionAccuracy', () => {
    it('should calculate accuracy results', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { model_type: 'RANDOM_FOREST', total: '100', correct: '75' }
      ]);

      const result = await service.getPredictionAccuracy();
      expect(result[0]).toEqual({
        modelType: 'RANDOM_FOREST',
        total: 100,
        correct: 75,
        accuracy: 75
      });
    });

    it('should handle zero total without division by zero error', async () => {
        mockQueryBuilder.getRawMany.mockResolvedValueOnce([
          { model_type: 'NAIVE', total: '0', correct: '0' }
        ]);
  
        const result = await service.getPredictionAccuracy();
        expect(result[0].accuracy).toBe(0);
      });
  });

  describe('getGrowthMetrics', () => {
    it('should calculate growth percentages correctly', async () => {
      mockRepo.count.mockResolvedValueOnce(100); // totalUsers
      mockRepo.count.mockResolvedValueOnce(20);  // totalPro
      
      mockQueryBuilder.getCount.mockResolvedValueOnce(10); // current (30d)
      mockQueryBuilder.getCount.mockResolvedValueOnce(5);  // previous (30-60d)
      
      // For the activities, it uses .getRawOne().then(...)
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '50' }); // current active
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '40' }); // previous active

      const result = await service.getGrowthMetrics();
      
      expect(result.totalUsers).toBe(100);
      expect(result.totalPro).toBe(20);
      expect(result.newUsersChange).toBe(100); // (10-5)/5 * 100
      expect(result.activeUsersChange).toBe(25); // (50-40)/40 * 100
    });

    it('should handle zero previous period to avoid infinity', async () => {
      mockRepo.count.mockResolvedValue(10);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });
      
      const result = await service.getGrowthMetrics();
      expect(result.newUsersChange).toBe(0);
      expect(result.activeUsersChange).toBe(0);
    });
  });

  describe('getRoleDistribution', () => {
    it('should map roles correctly', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { role: 'USER', count: '50' },
        { role: 'ADMIN', count: '2' }
      ]);

      const result = await service.getRoleDistribution();
      expect(result.users).toBe(50);
      expect(result.admins).toBe(2);
      expect(result.moderators).toBe(0);
    });
  });
});
