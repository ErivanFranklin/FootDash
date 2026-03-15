import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MatchPredictionService } from './match-prediction.service';
import { MatchPrediction, PredictionConfidence } from '../entities/match-prediction.entity';
import { Match } from '../../matches/entities/match.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { InsightsGeneratorService } from './insights-generator.service';

describe('MatchPredictionService (integration-like)', () => {
  let service: MatchPredictionService;
  let predictionRepo: any;
  let matchRepo: any;
  let formSvc: any;
  let statSvc: any;
  let insightSvc: any;

  // Mock QueryBuilder for getRecentMatches and getHeadToHeadMatches
  const createQueryBuilderMock = (results: any[]) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  });

  beforeEach(async () => {
    predictionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    matchRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    formSvc = {
      calculateForm: jest.fn(),
    };

    statSvc = {
      calculatePerformanceStats: jest.fn(),
      analyzeHeadToHead: jest.fn(),
    };

    insightSvc = {
      generateMatchInsights: jest.fn(),
      determineConfidence: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchPredictionService,
        { provide: getRepositoryToken(MatchPrediction), useValue: predictionRepo },
        { provide: getRepositoryToken(Match), useValue: matchRepo },
        { provide: FormCalculatorService, useValue: formSvc },
        { provide: StatisticalAnalysisService, useValue: statSvc },
        { provide: InsightsGeneratorService, useValue: insightSvc },
      ],
    }).compile();

    service = module.get<MatchPredictionService>(MatchPredictionService);
  });

  describe('getPrediction', () => {
    it('returns existing fresh prediction', async () => {
      const matchId = 123;
      const recentDate = new Date();
      const existing = {
        updatedAt: recentDate,
        matchId,
        homeWinProbability: 40,
        drawProbability: 30,
        awayWinProbability: 30,
        confidence: PredictionConfidence.MEDIUM,
        match: { homeTeam: { name: 'H' }, awayTeam: { name: 'A' } }
      };

      predictionRepo.findOne.mockResolvedValue(existing);

      const result = await service.getPrediction(matchId);
      expect(result.matchId).toBe(matchId);
      expect(predictionRepo.save).not.toHaveBeenCalled();
    });

    it('generates new prediction if existing is stale', async () => {
      const matchId = 123;
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 30);
      const stale = { updatedAt: oldDate, matchId };

      predictionRepo.findOne.mockResolvedValue(stale);
      
      // Mock generatePrediction dependencies
      matchRepo.findOne.mockResolvedValue({ 
        id: matchId, 
        homeTeam: { id: 1, name: 'H' }, 
        awayTeam: { id: 2, name: 'A' } 
      });
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]));
      formSvc.calculateForm.mockReturnValue({ formRating: 60 });
      statSvc.calculatePerformanceStats.mockReturnValue({ winPercentage: 40 });
      statSvc.analyzeHeadToHead.mockReturnValue({ homeWins: 1, awayWins: 1, draws: 1 });
      insightSvc.generateMatchInsights.mockReturnValue([]);
      insightSvc.determineConfidence.mockReturnValue('medium');
      
      const savedPrediction = { 
        id: 999, 
        matchId, 
        homeWinProbability: 40, 
        drawProbability: 30, 
        awayWinProbability: 30,
        confidence: PredictionConfidence.MEDIUM,
        match: { homeTeam: { name: 'H' }, awayTeam: { name: 'A' } }
      };
      predictionRepo.create.mockReturnValue(savedPrediction);
      predictionRepo.save.mockResolvedValue(savedPrediction);
      // For the re-fetch
      predictionRepo.findOne.mockResolvedValueOnce(stale).mockResolvedValueOnce(savedPrediction);

      const result = await service.getPrediction(matchId);
      expect(result.matchId).toBe(matchId);
      expect(predictionRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for unknown match', async () => {
      matchRepo.findOne.mockResolvedValue(null);
      await expect(service.generatePrediction(999)).rejects.toThrow(NotFoundException);
    });

    it('throws Error if saving prediction fails to return result', async () => {
      matchRepo.findOne.mockResolvedValue({ 
        id: 1, homeTeam: { id: 1 }, awayTeam: { id: 2 } 
      });
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]));
      formSvc.calculateForm.mockReturnValue({ formRating: 50 });
      statSvc.calculatePerformanceStats.mockReturnValue({ winPercentage: 30 });
      statSvc.analyzeHeadToHead.mockReturnValue({ homeWins: 0, awayWins: 0, draws: 0 });
      insightSvc.determineConfidence.mockReturnValue('low');
      
      predictionRepo.create.mockReturnValue({});
      predictionRepo.save.mockResolvedValue({ id: 1 });
      predictionRepo.findOne.mockResolvedValue(null); // simulate re-fetch failure

      await expect(service.generatePrediction(1)).rejects.toThrow('Failed to save prediction');
    });

    it('getUpcomingPredictions handles success and individual failures', async () => {
      const now = new Date();
      const matches = [
        { id: 1, homeTeam: { id: 10, name: 'H1' }, awayTeam: { id: 11, name: 'A1' } },
        { id: 2, homeTeam: { id: 20, name: 'H2' }, awayTeam: { id: 21, name: 'A2' } },
      ];
      
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock(matches));
      
      // Mock getPrediction: 1st succeeds, 2nd fails
      const prediction1 = { matchId: 1, homeTeam: 'H1', awayTeam: 'A1' };
      
      // We need to spy on the service or mock its findOne/generatePrediction logic
      // Simplest: mock predictionRepo.findOne to return1 for match 1, and fail for match 2
      predictionRepo.findOne.mockImplementation((args: any) => {
        if (args.where.matchId === 1) return Promise.resolve({ 
          updatedAt: new Date(), 
          matchId: 1, 
          homeWinProbability: 50, drawProbability: 25, awayWinProbability: 25,
          match: { homeTeam: { name: 'H1' }, awayTeam: { name: 'A1' } }
        });
        return Promise.resolve(null); // trigger generatePrediction for match 2
      });
      
      // matchRepo.findOne for generatePrediction of match 2 fails
      matchRepo.findOne.mockImplementation((args: any) => {
        if (args.where.id === 2) return Promise.resolve(null); // trigger NotFoundException
        return Promise.resolve(null);
      });

      const results = await service.getUpcomingPredictions(5);
      expect(results).toHaveLength(1);
      expect(results[0].matchId).toBe(1);
    });

    it('getMatchDataForPrediction returns combined data', async () => {
      matchRepo.findOne.mockResolvedValue({ 
        id: 1, homeTeam: { id: 1 }, awayTeam: { id: 2 } 
      });
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]));
      formSvc.calculateForm.mockReturnValue({ formRating: 80 });
      statSvc.calculatePerformanceStats.mockReturnValue({ winPercentage: 60 });
      statSvc.analyzeHeadToHead.mockReturnValue({ homeWins: 2, awayWins: 0, draws: 1 });

      const data = await service.getMatchDataForPrediction(1);
      expect(data).toBeDefined();
      expect(data.match.id).toBe(1);
    });
  });

  describe('Confidence mapping', () => {
    it('maps high confidence correctly', async () => {
      matchRepo.findOne.mockResolvedValue({ 
        id: 1, homeTeam: { id: 1 }, awayTeam: { id: 2 } 
      });
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]));
      formSvc.calculateForm.mockReturnValue({ formRating: 80 });
      statSvc.calculatePerformanceStats.mockReturnValue({ winPercentage: 60 });
      statSvc.analyzeHeadToHead.mockReturnValue({ homeWins: 2, awayWins: 0, draws: 1 });
      insightSvc.determineConfidence.mockReturnValue('high');
      
      const saved = { 
        id: 1, 
        confidence: PredictionConfidence.HIGH,
        match: { homeTeam: { id: 1 }, awayTeam: { id: 2 } }
      };
      predictionRepo.create.mockReturnValue(saved);
      predictionRepo.save.mockResolvedValue(saved);
      predictionRepo.findOne.mockResolvedValue(saved);

      await service.generatePrediction(1);
      expect(predictionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        confidence: PredictionConfidence.HIGH
      }));
    });

    it('maps low confidence correctly', async () => {
      matchRepo.findOne.mockResolvedValue({ 
        id: 1, homeTeam: { id: 1 }, awayTeam: { id: 2 } 
      });
      matchRepo.createQueryBuilder.mockReturnValue(createQueryBuilderMock([]));
      formSvc.calculateForm.mockReturnValue({ formRating: 40 });
      statSvc.calculatePerformanceStats.mockReturnValue({ winPercentage: 20 });
      statSvc.analyzeHeadToHead.mockReturnValue({ homeWins: 0, awayWins: 0, draws: 0 });
      insightSvc.determineConfidence.mockReturnValue('low');
      
      const saved = { 
        id: 1, 
        confidence: PredictionConfidence.LOW,
        match: { homeTeam: { id: 1 }, awayTeam: { id: 2 } }
      };
      predictionRepo.create.mockReturnValue(saved);
      predictionRepo.save.mockResolvedValue(saved);
      predictionRepo.findOne.mockResolvedValue(saved);

      await service.generatePrediction(1);
      expect(predictionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        confidence: PredictionConfidence.LOW
      }));
    });
  });
});
