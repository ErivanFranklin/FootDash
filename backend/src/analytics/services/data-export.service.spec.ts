import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DataExportService, TrainingDataExportParams } from './data-export.service';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';

describe('DataExportService', () => {
  let service: DataExportService;
  let matchRepository: Repository<Match>;
  let teamRepository: Repository<Team>;
  let formCalculator: FormCalculatorService;
  let statisticalAnalysis: StatisticalAnalysisService;

  const mockMatch = (id: number, homeId: number, awayId: number): Partial<Match> => ({
    id,
    homeTeam: { id: homeId } as any,
    awayTeam: { id: awayId } as any,
    league: { id: 39 } as any,
    season: '2023',
    status: 'FINISHED',
    homeScore: 2,
    awayScore: 1,
    kickOff: new Date('2023-10-01T15:00:00Z'),
  });

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportService,
        {
          provide: getRepositoryToken(Match),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: FormCalculatorService,
          useValue: {
            calculateForm: jest.fn(),
          },
        },
        {
          provide: StatisticalAnalysisService,
          useValue: {
            calculatePerformanceStats: jest.fn(),
            analyzeHeadToHead: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DataExportService>(DataExportService);
    matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));
    teamRepository = module.get<Repository<Team>>(getRepositoryToken(Team));
    formCalculator = module.get<FormCalculatorService>(FormCalculatorService);
    statisticalAnalysis = module.get<StatisticalAnalysisService>(StatisticalAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportTrainingData', () => {
    it('should throw BadRequestException if no matches found', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      await expect(service.exportTrainingData()).rejects.toThrow(BadRequestException);
    });

    it('should export training data for eligible teams', async () => {
      const match1 = mockMatch(1, 101, 102);
      const match2 = mockMatch(2, 101, 102);
      const matches = [match1, match2];

      mockQueryBuilder.getMany.mockResolvedValueOnce(matches); // Main query
      mockQueryBuilder.getMany.mockResolvedValue([]); // Mock historical/h2h queries

      jest.spyOn(formCalculator, 'calculateForm').mockReturnValue({ formRating: 70, recentForm: 'WWWWW' } as any);
      jest.spyOn(statisticalAnalysis, 'calculatePerformanceStats').mockReturnValue({ winPercentage: 60, played: 10, goalsFor: 20, goalsAgainst: 10 } as any);
      jest.spyOn(statisticalAnalysis, 'analyzeHeadToHead').mockReturnValue({ homeWins: 2, awayWins: 1, draws: 0 } as any);

      const params: TrainingDataExportParams = {
        minMatchesPerTeam: 1,
        seasons: ['2023'],
        leagues: [39],
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      };

      const result = await service.exportTrainingData(params);

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total_matches).toBe(2);
      expect(result.data[0].outcome).toBe('HOME_WIN');
      expect(result.data[0].home_team_id).toBe(101);
      expect(result.data[0].away_team_id).toBe(102);
    });

    it('should handle different match outcomes correctly', async () => {
       const homeWin = { ...mockMatch(1, 101, 102), homeScore: 2, awayScore: 1 };
       const awayWin = { ...mockMatch(2, 103, 104), homeScore: 0, awayScore: 3 };
       const draw = { ...mockMatch(3, 105, 106), homeScore: 1, awayScore: 1 };
       
       mockQueryBuilder.getMany.mockResolvedValueOnce([homeWin, awayWin, draw]);
       mockQueryBuilder.getMany.mockResolvedValue([]); // Sub-queries

       jest.spyOn(formCalculator, 'calculateForm').mockReturnValue({ formRating: 50 } as any);
       jest.spyOn(statisticalAnalysis, 'calculatePerformanceStats').mockReturnValue({ played: 0 } as any);
       jest.spyOn(statisticalAnalysis, 'analyzeHeadToHead').mockReturnValue({} as any);

       const result = await service.exportTrainingData({ minMatchesPerTeam: 1 });
       
       expect(result.data[0].outcome).toBe('HOME_WIN');
       expect(result.data[1].outcome).toBe('AWAY_WIN');
       expect(result.data[2].outcome).toBe('DRAW');
    });

    it('should skip teams that do not meet minMatchesPerTeam', async () => {
      const match1 = mockMatch(1, 101, 102);
      const match2 = mockMatch(2, 101, 103);
      const matches = [match1, match2];

      mockQueryBuilder.getMany.mockResolvedValueOnce(matches);
      
      const result = await service.exportTrainingData({ minMatchesPerTeam: 2 });
      
      // Team 101 has 2 matches (eligible)
      // Team 102 has 1 match (ineligible)
      // Team 103 has 1 match (ineligible)
      // Both matches involve an ineligible team, so training data should be empty
      expect(result.data).toHaveLength(0);
    });

    it('should handle errors in createTrainingDataPoint gracefully', async () => {
      const match1 = mockMatch(1, 101, 102);
      const matches = [match1];

      mockQueryBuilder.getMany.mockResolvedValueOnce(matches);
      // Force an error in createTrainingDataPoint by making kickOff null
      match1.kickOff = null as any;

      const result = await service.exportTrainingData({ minMatchesPerTeam: 1 });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('convertToCSV', () => {
    it('should return empty string for empty data', () => {
      expect(service.convertToCSV([])).toBe('');
    });

    it('should convert data points to CSV string', () => {
      const data: any[] = [
        { id: 1, name: 'Test', value: 10.5 },
        { id: 2, name: 'Sample', value: 20 }
      ];
      const csv = service.convertToCSV(data);
      expect(csv).toContain('id,name,value');
      expect(csv).toContain('1,Test,10.5');
      expect(csv).toContain('2,Sample,20');
    });
  });

  describe('Private helpers coverage', () => {
    it('should calculate season stage correctly (Aug-Dec)', () => {
        // Aug is month 8
        const augDate = new Date('2023-08-15');
        const stage = (service as any).getSeasonStage(augDate);
        expect(stage).toBe(0); // (8-8)/4
    });

    it('should calculate season stage correctly (Jan-Feb)', () => {
        const janDate = new Date('2023-01-15');
        const stage = (service as any).getSeasonStage(janDate);
        expect(stage).toBeCloseTo(0.833, 2); // (1+4)/6 = 5/6 = 0.833
    });

    it('should calculate season stage correctly (Mar-May)', () => {
        const mayDate = new Date('2023-05-15');
        const stage = (service as any).getSeasonStage(mayDate);
        // month 5: 0.5 + (5-3)/4 = 0.5 + 0.5 = 1.0
        expect(stage).toBe(1.0);
    });

    it('should calculate days since last match with default', () => {
        const result = (service as any).calculateDaysSinceLastMatch([], [], new Date());
        expect(result).toBe(14);
    });

     it('should calculate days since last match capped at 30', () => {
        const matchDate = new Date('2023-11-01');
        const lastMatch = new Date('2023-01-01');
        const result = (service as any).calculateDaysSinceLastMatch([{ kickOff: lastMatch }], [], matchDate);
        expect(result).toBe(30);
    });

    it('should return default league strength for unknown league', () => {
        expect((service as any).getLeagueStrength(999)).toBe(0.7);
        expect((service as any).getLeagueStrength(null)).toBe(0.7);
    });

    it('should return correct strength for Premier League (39)', () => {
        expect((service as any).getLeagueStrength(39)).toBe(1.0);
    });

    it('should calculate H2H advantage correctly', () => {
        const h2h = { homeWins: 3, awayWins: 1, draws: 1 };
        const result = (service as any).calculateH2HAdvantage(h2h);
        expect(result).toBe((3 - 1) / 5);
    });

    it('should return 0 H2H advantage for no matches', () => {
        expect((service as any).calculateH2HAdvantage({})).toBe(0);
    });
  });
});
