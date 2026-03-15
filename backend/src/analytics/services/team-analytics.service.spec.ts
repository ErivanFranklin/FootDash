import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TeamAnalyticsService } from './team-analytics.service';
import { TeamAnalytics } from '../entities/team-analytics.entity';
import { Team } from '../../teams/entities/team.entity';
import { Match } from '../../matches/entities/match.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { InsightsGeneratorService } from './insights-generator.service';

describe('TeamAnalyticsService', () => {
  let service: TeamAnalyticsService;
  let analyticsRepo: any;
  let teamRepo: any;
  let matchRepo: any;
  let formCalculator: any;
  let statisticalAnalysis: any;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn().mockImplementation((args) => {
        // If searching for a team
        if (args?.where?.id === 1) return Promise.resolve({ id: 1, name: 'Arsenal' });
        return Promise.resolve(null);
      }),
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: 1 })),
      createQueryBuilder: jest.fn(),
    };

    const mockTeamRepo = {
      findOne: jest.fn().mockImplementation((args) => {
        if (args?.where?.id === 1) return Promise.resolve({ id: 1, name: 'Arsenal' });
        return Promise.resolve(null);
      }),
      find: jest.fn(),
    };

    const mockFormCalculator = {
      calculateForm: jest.fn().mockReturnValue({ formRating: 80, recentResults: [] }),
    };

    const mockStatisticalAnalysis = {
      calculatePerformanceStats: jest.fn().mockReturnValue({
        played: 10, won: 6, drawn: 2, lost: 2, goalsFor: 20, goalsAgainst: 10, points: 20, winPercentage: 60
      }),
      calculateDefensiveRating: jest.fn().mockReturnValue(75),
      calculateScoringTrend: jest.fn().mockReturnValue({ trend: 'up', average: 2.0 }),
      analyzeHeadToHead: jest.fn(),
    };

    const mockInsightsGenerator = {
      generateInsights: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamAnalyticsService,
        { provide: getRepositoryToken(TeamAnalytics), useValue: mockRepo },
        { provide: getRepositoryToken(Team), useValue: mockTeamRepo },
        { provide: getRepositoryToken(Match), useValue: mockRepo },
        { provide: FormCalculatorService, useValue: mockFormCalculator },
        { provide: StatisticalAnalysisService, useValue: mockStatisticalAnalysis },
        { provide: InsightsGeneratorService, useValue: mockInsightsGenerator },
      ],
    }).compile();

    service = module.get<TeamAnalyticsService>(TeamAnalyticsService);
    analyticsRepo = module.get(getRepositoryToken(TeamAnalytics));
    teamRepo = module.get(getRepositoryToken(Team));
    matchRepo = module.get(getRepositoryToken(Match));
    formCalculator = module.get(FormCalculatorService);
    statisticalAnalysis = module.get(StatisticalAnalysisService);
  });

  describe('getTeamAnalytics', () => {
    it('returns cached analytics if fresh', async () => {
      const freshDate = new Date();
      const mockAnalytics = {
        teamId: 1,
        season: '2023',
        lastUpdated: freshDate,
        updatedAt: freshDate,
        team: { name: 'Arsenal' },
        homePerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        awayPerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        overallStats: { totalPlayed: 10, totalWon: 6, totalDrawn: 2, totalLost: 2, totalGoalsFor: 20, totalGoalsAgainst: 10, winPercentage: 60 },
        scoringTrend: {},
        defensiveRating: 75,
      };
      analyticsRepo.findOne.mockResolvedValue(mockAnalytics);
      
      jest.spyOn(service as any, 'resolveSeasonForTeam').mockResolvedValue('2023');

      const result = await service.getTeamAnalytics(1, '2023');
      expect(result).toBeDefined();
      expect(result.teamName).toBe('Arsenal');
      expect(statisticalAnalysis.calculatePerformanceStats).not.toHaveBeenCalled();
    });

    it('calculates and saves new analytics if cache is missing', async () => {
      analyticsRepo.findOne.mockResolvedValueOnce(null); // First check in getTeamAnalytics
      analyticsRepo.findOne.mockResolvedValueOnce(null); // Check in calculateTeamAnalytics
      analyticsRepo.findOne.mockResolvedValueOnce({ 
        id: 1, 
        teamId: 1,
        team: { name: 'Arsenal' }, 
        updatedAt: new Date(),
        homePerformance: { goalsFor: 0, goalsAgainst: 0, played: 0 },
        awayPerformance: { goalsFor: 0, goalsAgainst: 0, played: 0 },
        overallStats: { totalGoalsFor: 0, totalGoalsAgainst: 0, totalPlayed: 0, totalWon: 0, totalDrawn: 0, winPercentage: 0 },
        scoringTrend: {}
      }); // Final fetch after save
      
      jest.spyOn(service as any, 'getTeamMatches').mockResolvedValue([]);
      
      const result = await service.getTeamAnalytics(1, '2023');
      
      expect(analyticsRepo.save).toHaveBeenCalled();
      expect(result.teamName).toBe('Arsenal');
    });

    it('throws NotFoundException if team does not exist', async () => {
      teamRepo.findOne.mockResolvedValue(null);
      await expect(service.calculateTeamAnalytics(999, '2023')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isAnalyticsFresh', () => {
    it('should return true if updated within 7 days', () => {
      const recent = new Date();
      recent.setHours(recent.getHours() - (24 * 6));
      expect((service as any).isAnalyticsFresh({ updatedAt: recent })).toBe(true);
    });

    it('should return false if updated more than 7 days ago', () => {
      const old = new Date();
      old.setHours(old.getHours() - (24 * 8));
      expect((service as any).isAnalyticsFresh({ updatedAt: old })).toBe(false);
    });
  });

  describe('resolveSeasonForTeam', () => {
    it('returns current season if matches exist', async () => {
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      matchRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await (service as any).resolveSeasonForTeam(1);
      expect(result).toBeDefined();
      expect(queryBuilder.getCount).toHaveBeenCalled();
    });

    it('falls back to latest season if current has no matches', async () => {
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ season: '2022' }),
      };
      matchRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await (service as any).resolveSeasonForTeam(1);
      expect(result).toBe('2022');
    });
  });

  describe('refreshAllTeamAnalytics', () => {
    it('refreshes all teams', async () => {
      teamRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      jest.spyOn(service, 'calculateTeamAnalytics').mockResolvedValue({} as any);

      const count = await service.refreshAllTeamAnalytics('2023');
      expect(count).toBe(2);
      expect(service.calculateTeamAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  describe('compareTeams', () => {
    it('compares two teams and determines advantage', async () => {
      const team1Analytics = {
        teamName: 'Team A',
        formRating: 90,
        homePerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        awayPerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        overallStats: { played: 10, won: 6, drawn: 2, lost: 2, goalsFor: 20, goalsAgainst: 10, winPercentage: 60 },
      };
      const team2Analytics = {
        teamName: 'Team B',
        formRating: 60,
        homePerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        awayPerformance: { goalsFor: 10, goalsAgainst: 5, played: 5, won: 3 },
        overallStats: { played: 10, won: 6, drawn: 2, lost: 2, goalsFor: 20, goalsAgainst: 10, winPercentage: 60 },
      };

      jest.spyOn(service, 'getTeamAnalytics')
        .mockResolvedValueOnce(team1Analytics as any)
        .mockResolvedValueOnce(team2Analytics as any);

      const mockH2h = { homeWins: 2, awayWins: 1, draws: 1 };
      statisticalAnalysis.analyzeHeadToHead = jest.fn().mockReturnValue(mockH2h);
      
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
      };
      matchRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.compareTeams(1, 2, '2023');
      expect(result.advantage).toBe('home');
      expect(result.keyInsights.length).toBeGreaterThan(0);
    });
  });

  describe('mapToDto', () => {
    it('should correctly map entity to dto', () => {
      const entity = {
        teamId: 1,
        team: { name: 'Arsenal' },
        season: '2023',
        formRating: 85,
        homePerformance: { won: 5, goalsFor: 10, goalsAgainst: 2, played: 6 },
        awayPerformance: { won: 3, goalsFor: 8, goalsAgainst: 8, played: 6 },
        overallStats: { totalPlayed: 12, totalWon: 8, totalDrawn: 2, totalLost: 2, totalGoalsFor: 18, totalGoalsAgainst: 10, winPercentage: 66.6 },
        scoringTrend: { trend: 'up' },
        defensiveRating: 80,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      };
      
      const dto = (service as any).mapToDto(entity);
      expect(dto.teamName).toBe('Arsenal');
      expect(dto.formRating).toBe(85);
      expect(dto.overallStats.points).toBe(26); // 8*3 + 2
    });
  });
});
