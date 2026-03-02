import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationService } from './gamification.service';
import { UserPrediction } from './entities/user-prediction.entity';
import { MatchFinishedEvent } from '../matches/events/match-finished.event';

const mockPredictionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('GamificationService', () => {
  let service: GamificationService;
  let repo: ReturnType<typeof mockPredictionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(UserPrediction), useFactory: mockPredictionRepository },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    repo = module.get(getRepositoryToken(UserPrediction));
    jest.clearAllMocks();
  });

  // ─── calculatePoints ──────────────────────────────────────────────────────

  describe('calculatePoints', () => {
    it('returns 3 for an exact scoreline match', () => {
      expect(service.calculatePoints(2, 1, 2, 1)).toBe(3);
    });

    it('returns 1 for a correct outcome (home win predicted correctly)', () => {
      expect(service.calculatePoints(2, 0, 3, 1)).toBe(1);
    });

    it('returns 1 for a correct draw prediction', () => {
      expect(service.calculatePoints(1, 1, 2, 2)).toBe(1);
    });

    it('returns 1 for a correct away-win prediction', () => {
      expect(service.calculatePoints(0, 2, 1, 3)).toBe(1);
    });

    it('returns 0 for a wrong outcome', () => {
      expect(service.calculatePoints(2, 0, 0, 1)).toBe(0);
    });

    it('returns 0 when predicting draw but result is a home win', () => {
      expect(service.calculatePoints(1, 1, 2, 0)).toBe(0);
    });
  });

  // ─── submitPrediction ─────────────────────────────────────────────────────

  describe('submitPrediction', () => {
    it('creates and saves a new prediction', async () => {
      const mockPred: Partial<UserPrediction> = {
        userId: 1,
        matchId: 5,
        homeScore: 2,
        awayScore: 1,
      };
      repo.create.mockReturnValue(mockPred);
      repo.save.mockResolvedValue({ id: 1, ...mockPred });

      const result = await service.submitPrediction(1, 5, 2, 1);

      expect(repo.create).toHaveBeenCalledWith({
        userId: 1,
        matchId: 5,
        homeScore: 2,
        awayScore: 1,
      });
      expect(repo.save).toHaveBeenCalledWith(mockPred);
      expect(result).toMatchObject({ id: 1, matchId: 5 });
    });
  });

  // ─── processMatchResult ──────────────────────────────────────────────────

  describe('processMatchResult', () => {
    it('assigns exact-score points to matching predictions', async () => {
      const saved: Partial<UserPrediction>[] = [];
      const predictions = [
        { id: 1, userId: 1, matchId: 10, homeScore: 2, awayScore: 1, points: null },
        { id: 2, userId: 2, matchId: 10, homeScore: 1, awayScore: 1, points: null },
      ];
      repo.find.mockResolvedValue(predictions);
      repo.save.mockImplementation(async (p) => { saved.push(p); return p; });

      await service.processMatchResult(10, 2, 1);

      expect(saved[0].points).toBe(3); // exact match
      expect(saved[1].points).toBe(0); // wrong outcome (predicted draw, got home win)
    });

    it('assigns outcome points for correct predictions', async () => {
      const saved: Partial<UserPrediction>[] = [];
      const predictions = [
        { id: 3, userId: 3, matchId: 11, homeScore: 3, awayScore: 0, points: null },
      ];
      repo.find.mockResolvedValue(predictions);
      repo.save.mockImplementation(async (p) => { saved.push(p); return p; });

      await service.processMatchResult(11, 2, 0); // actual: 2-0, predicted: 3-0 (home win → correct outcome)

      expect(saved[0].points).toBe(1);
    });

    it('handles a match with no predictions gracefully', async () => {
      repo.find.mockResolvedValue([]);
      await expect(service.processMatchResult(99, 0, 0)).resolves.not.toThrow();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ─── onMatchFinished event handler ───────────────────────────────────────

  describe('onMatchFinished', () => {
    it('calls processMatchResult with event data', async () => {
      jest.spyOn(service, 'processMatchResult').mockResolvedValue();
      const event = new MatchFinishedEvent(42, 3, 1);

      await service.onMatchFinished(event);

      expect(service.processMatchResult).toHaveBeenCalledWith(42, 3, 1);
    });
  });
});
