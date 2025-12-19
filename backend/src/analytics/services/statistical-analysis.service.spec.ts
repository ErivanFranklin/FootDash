import { Test, TestingModule } from '@nestjs/testing';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';

describe('StatisticalAnalysisService', () => {
  let service: StatisticalAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticalAnalysisService],
    }).compile();

    service = module.get<StatisticalAnalysisService>(
      StatisticalAnalysisService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePerformanceStats', () => {
    it('should calculate performance metrics correctly', () => {
      const matches = createMockMatches([
        {
          homeScore: 3,
          awayScore: 1,
          homeGoals: 10,
          awayGoals: 5,
          isHome: true,
        }, // Win
        {
          homeScore: 2,
          awayScore: 2,
          homeGoals: 8,
          awayGoals: 8,
          isHome: true,
        }, // Draw
        {
          homeScore: 2,
          awayScore: 1,
          homeGoals: 6,
          awayGoals: 9,
          isHome: false,
        }, // Loss (Team 1 is away, awayScore 1 < homeScore 2)
        {
          homeScore: 4,
          awayScore: 0,
          homeGoals: 12,
          awayGoals: 2,
          isHome: true,
        }, // Win
      ]);

      const result = service.calculatePerformanceStats(matches, 1);

      expect(result.played).toBe(4);
      expect(result.won).toBe(2);
      expect(result.drawn).toBe(1);
      expect(result.lost).toBe(1);
      expect(result.winPercentage).toBeCloseTo(50, 0);
      expect(result.goalsFor).toBeGreaterThan(0);
      expect(result.goalsAgainst).toBeGreaterThan(0);
    });

    it('should handle perfect record (all wins)', () => {
      const matches = createMockMatches([
        {
          homeScore: 3,
          awayScore: 0,
          homeGoals: 9,
          awayGoals: 2,
          isHome: true,
        },
        {
          homeScore: 2,
          awayScore: 1,
          homeGoals: 6,
          awayGoals: 3,
          isHome: true,
        },
        {
          homeScore: 0,
          awayScore: 1,
          homeGoals: 3,
          awayGoals: 1,
          isHome: false,
        }, // Win (Team 1 is away, awayScore 1 > homeScore 0)
      ]);

      const result = service.calculatePerformanceStats(matches, 1);

      expect(result.won).toBe(3);
      expect(result.drawn).toBe(0);
      expect(result.lost).toBe(0);
      expect(result.winPercentage).toBe(100);
    });

    it('should handle winless record', () => {
      const matches = createMockMatches([
        {
          homeScore: 0,
          awayScore: 2,
          homeGoals: 2,
          awayGoals: 8,
          isHome: true,
        }, // Loss
        {
          homeScore: 1,
          awayScore: 1,
          homeGoals: 4,
          awayGoals: 4,
          isHome: true,
        }, // Draw
        {
          homeScore: 0,
          awayScore: 0,
          homeGoals: 3,
          awayGoals: 3,
          isHome: false,
        }, // Draw
      ]);

      const result = service.calculatePerformanceStats(matches, 1);

      expect(result.won).toBe(0);
      expect(result.drawn).toBe(2);
      expect(result.lost).toBe(1);
      expect(result.winPercentage).toBe(0);
    });

    it('should filter by home matches only', () => {
      const matches = createMockMatches([
        {
          homeScore: 2,
          awayScore: 0,
          homeGoals: 5,
          awayGoals: 1,
          isHome: true,
        },
        {
          homeScore: 1,
          awayScore: 1,
          homeGoals: 3,
          awayGoals: 3,
          isHome: false,
        },
      ]);

      const result = service.calculatePerformanceStats(matches, 1, true);

      expect(result.played).toBe(1);
      expect(result.won).toBe(1);
    });

    it('should filter by away matches only', () => {
      const matches = createMockMatches([
        {
          homeScore: 2,
          awayScore: 0,
          homeGoals: 5,
          awayGoals: 1,
          isHome: true,
        },
        {
          homeScore: 1,
          awayScore: 1,
          homeGoals: 3,
          awayGoals: 3,
          isHome: false,
        },
      ]);

      const result = service.calculatePerformanceStats(matches, 1, false);

      expect(result.played).toBe(1);
      expect(result.drawn).toBe(1);
    });

    it('should calculate home and away performance separately', () => {
      const matches = createMockMatches([
        {
          homeScore: 3,
          awayScore: 0,
          homeGoals: 9,
          awayGoals: 2,
          isHome: true,
        }, // Home win
        {
          homeScore: 2,
          awayScore: 1,
          homeGoals: 6,
          awayGoals: 3,
          isHome: true,
        }, // Home win
        {
          homeScore: 2,
          awayScore: 1,
          homeGoals: 3,
          awayGoals: 6,
          isHome: false,
        }, // Away loss (Team 1 is away, awayScore 1 < homeScore 2)
        {
          homeScore: 1,
          awayScore: 0,
          homeGoals: 2,
          awayGoals: 3,
          isHome: false,
        }, // Away loss (Team 1 is away, awayScore 0 < homeScore 1)
      ]);

      const homeResult = service.calculatePerformanceStats(matches, 1, true);
      const awayResult = service.calculatePerformanceStats(matches, 1, false);

      expect(homeResult.won).toBe(2);
      expect(awayResult.won).toBe(0);
      expect(homeResult.lost).toBe(0);
      expect(awayResult.lost).toBe(2);
    });
  });

  describe('analyzeHeadToHead', () => {
    it('should analyze head-to-head record correctly', () => {
      const matches = createH2HMatches([
        { homeTeam: 1, awayTeam: 2, homeScore: 3, awayScore: 1 }, // Team 1 wins
        { homeTeam: 2, awayTeam: 1, homeScore: 2, awayScore: 2 }, // Draw
        { homeTeam: 1, awayTeam: 2, homeScore: 1, awayScore: 2 }, // Team 2 wins
        { homeTeam: 2, awayTeam: 1, homeScore: 0, awayScore: 1 }, // Team 1 wins
      ]);

      const result = service.analyzeHeadToHead(matches, 1, 2);

      expect(result.homeTeamId).toBe(1);
      expect(result.awayTeamId).toBe(2);
      expect(result.homeWins).toBe(2); // Team 1 (home in analysis)
      expect(result.awayWins).toBe(1); // Team 2 (away in analysis)
      expect(result.draws).toBe(1);
    });

    it('should handle no previous meetings', () => {
      const result = service.analyzeHeadToHead([], 1, 2);

      expect(result.homeWins).toBe(0);
      expect(result.awayWins).toBe(0);
      expect(result.draws).toBe(0);
    });
  });

  describe('calculateDefensiveRating', () => {
    it('should calculate defensive rating correctly', () => {
      const matches = createMockMatches([
        {
          homeScore: 0,
          awayScore: 1,
          homeGoals: 0,
          awayGoals: 1,
          isHome: true,
        },
        {
          homeScore: 1,
          awayScore: 2,
          homeGoals: 1,
          awayGoals: 2,
          isHome: false,
        },
      ]);

      const rating = service.calculateDefensiveRating(matches, 1);

      // Goals against: 1 (home) + 1 (away) = 2
      // Played: 2
      // Rating: 2 / 2 = 1
      expect(rating).toBe(1);
    });
  });

  describe('calculateAttackingRating', () => {
    it('should calculate attacking rating correctly', () => {
      const matches = createMockMatches([
        {
          homeScore: 3,
          awayScore: 0,
          homeGoals: 3,
          awayGoals: 0,
          isHome: true,
        },
        {
          homeScore: 1,
          awayScore: 1,
          homeGoals: 1,
          awayGoals: 1,
          isHome: false,
        },
      ]);

      const rating = service.calculateAttackingRating(matches, 1);

      // Goals for: 3 (home) + 1 (away) = 4
      // Played: 2
      // Rating: 4 / 2 = 2
      expect(rating).toBe(2);
    });
  });

  // Helper functions
  function createMockMatches(
    configs: Array<{
      homeScore: number;
      awayScore: number;
      homeGoals: number;
      awayGoals: number;
      isHome: boolean;
    }>,
  ): Match[] {
    return configs.map((config, index) => {
      const match = new Match();
      match.id = index + 1;
      match.homeScore = config.homeScore;
      match.awayScore = config.awayScore;
      match.kickOff = new Date(2024, 0, index + 1);
      match.status = 'FINISHED';

      const homeTeam = new Team();
      homeTeam.id = config.isHome ? 1 : 2;
      homeTeam.name = config.isHome ? 'Test Team' : 'Opponent';
      match.homeTeam = homeTeam;

      const awayTeam = new Team();
      awayTeam.id = config.isHome ? 2 : 1;
      awayTeam.name = config.isHome ? 'Opponent' : 'Test Team';
      match.awayTeam = awayTeam;

      return match;
    });
  }

  function createH2HMatches(
    configs: Array<{
      homeTeam: number;
      awayTeam: number;
      homeScore: number;
      awayScore: number;
    }>,
  ): Match[] {
    return configs.map((config, index) => {
      const match = new Match();
      match.id = index + 1;
      match.homeScore = config.homeScore;
      match.awayScore = config.awayScore;
      match.kickOff = new Date(2024, 11, 10 - index); // Reverse chronological
      match.status = 'FINISHED';

      const homeTeam = new Team();
      homeTeam.id = config.homeTeam;
      homeTeam.name = `Team ${config.homeTeam}`;
      match.homeTeam = homeTeam;

      const awayTeam = new Team();
      awayTeam.id = config.awayTeam;
      awayTeam.name = `Team ${config.awayTeam}`;
      match.awayTeam = awayTeam;

      return match;
    });
  }
});
