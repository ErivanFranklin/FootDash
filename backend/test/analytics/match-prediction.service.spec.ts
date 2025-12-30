import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MatchPredictionService } from '../../src/analytics/services/match-prediction.service';
import { MatchPrediction } from '../../src/analytics/entities/match-prediction.entity';
import { Match } from '../../src/matches/entities/match.entity';
import { FormCalculatorService } from '../../src/analytics/services/form-calculator.service';
import { StatisticalAnalysisService } from '../../src/analytics/services/statistical-analysis.service';
import { InsightsGeneratorService } from '../../src/analytics/services/insights-generator.service';
import { Repository } from 'typeorm';

describe('MatchPredictionService', () => {
  let service: MatchPredictionService;

  const mockMatchRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchPredictionService,
        {
          provide: getRepositoryToken(MatchPrediction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Match),
          useValue: mockMatchRepository,
        },
        {
          provide: FormCalculatorService,
          useValue: {
            calculateForm: jest.fn().mockReturnValue({ formRating: 50 }),
          },
        },
        {
          provide: StatisticalAnalysisService,
          useValue: {
            calculatePerformanceStats: jest
              .fn()
              .mockReturnValue({ winPercentage: 50 }),
            analyzeHeadToHead: jest
              .fn()
              .mockReturnValue({ homeWins: 1, awayWins: 1, draws: 1 }),
          },
        },
        {
          provide: InsightsGeneratorService,
          useValue: {
            generateMatchInsights: jest.fn().mockReturnValue([]),
            determineConfidence: jest.fn().mockReturnValue('medium'),
          },
        },
      ],
    }).compile();

    service = module.get<MatchPredictionService>(MatchPredictionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMatchDataForPrediction', () => {
    it('should include season in matchDetails', async () => {
      const match = {
        id: 1,
        homeTeam: { id: 1, name: 'Team A' },
        awayTeam: { id: 2, name: 'Team B' },
        league: { id: 1, name: 'League A' },
        season: '2023',
        kickOff: new Date(),
      };
      mockMatchRepository.findOne.mockResolvedValue(match);

      const result = await service.getMatchDataForPrediction(1);

      expect(result.matchDetails.season).toEqual('2023');
    });
  });
});
