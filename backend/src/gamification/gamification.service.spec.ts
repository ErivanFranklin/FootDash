import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { UserPrediction } from './entities/user-prediction.entity';
import { Leaderboard } from './entities/leaderboard.entity';
import { Match } from '../matches/entities/match.entity';
import { MatchFinishedEvent } from '../matches/events/match-finished.event';

describe('GamificationService', () => {
  let service: GamificationService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ maxPeriod: '2023-W01' }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation(d => d),
    save: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({}),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(UserPrediction), useValue: mockRepo },
        { provide: getRepositoryToken(Leaderboard), useValue: mockRepo },
        { provide: getRepositoryToken(Match), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePoints', () => {
    it('should calculate correct points', () => {
      expect(service.calculatePoints(2, 1, 2, 1)).toBe(3);
      expect(service.calculatePoints(2, 1, 2, 0)).toBe(1);
    });
  });

  describe('onMatchFinished', () => {
    it('should trigger processing', async () => {
      jest.spyOn(service, 'processMatchResult').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'rebuildLeaderboards').mockResolvedValue(undefined as any);
      await service.onMatchFinished({ matchId: 1, homeScore: 2, awayScore: 1 });
      expect(service.processMatchResult).toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return mapped rows', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { rank: 1, userId: 10, points: 5, email: 'a@b.com', displayName: 'User' }
      ]);
      const res = await service.getLeaderboard('weekly');
      expect(res[0].userName).toBe('User');
    });
  });

  describe('rebuildLeaderboards', () => {
    it('should run without error', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([{ matchId: 1 }]);
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 1, homeScore: 1, awayScore: 1 }]);
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([]); // No aggregates
      const res = await service.rebuildLeaderboards(['all-time']);
      expect(res.success).toBe(true);
    });
  });
});
