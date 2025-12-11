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

  describe('analyzePerformance', () => {
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
          homeScore: 1,
          awayScore: 2,
          homeGoals: 6,
          awayGoals: 9,
          isHome: false,
        }, // Loss
        {
          homeScore: 4,
          awayScore: 0,
          homeGoals: 12,
          awayGoals: 2,
          isHome: true,
        }, // Win
      ]);

      const result = service.analyzePerformance(matches, 1);

      expect(result.played).toBe(4);
      expect(result.wins).toBe(2);
      expect(result.draws).toBe(1);
      expect(result.losses).toBe(1);
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
          homeScore: 1,
          awayScore: 0,
          homeGoals: 3,
          awayGoals: 1,
          isHome: false,
        },
      ]);

      const result = service.analyzePerformance(matches, 1);

      expect(result.wins).toBe(3);
      expect(result.draws).toBe(0);
      expect(result.losses).toBe(0);
      expect(result.winPercentage).toBe(100);
    });

    it('should handle winless record', () => {
      const matches = createMockMatches([
        {
          homeScore: 0,
          awayScore: 2,
          homeGoals: 2,
          awayGoals: 6,
          isHome: true,
        },
        {
          homeScore: 1,
          awayScore: 1,
          homeGoals: 3,
          awayGoals: 3,
          isHome: true,
        },
        {
          homeScore: 0,
          awayScore: 1,
          homeGoals: 1,
          awayGoals: 3,
          isHome: false,
        },
      ]);

      const result = service.analyzePerformance(matches, 1);

      expect(result.wins).toBe(0);
      expect(result.draws).toBe(1);
      expect(result.losses).toBe(2);
      expect(result.winPercentage).toBe(0);
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
          homeScore: 1,
          awayScore: 2,
          homeGoals: 3,
          awayGoals: 6,
          isHome: false,
        }, // Away loss
        {
          homeScore: 0,
          awayScore: 1,
          homeGoals: 2,
          awayGoals: 3,
          isHome: false,
        }, // Away loss
      ]);

      const result = service.analyzePerformance(matches, 1);

      expect(result.homeWins).toBe(2);
      expect(result.awayWins).toBe(0);
      expect(result.homeLosses).toBe(0);
      expect(result.awayLosses).toBe(2);
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
      expect(result.totalMeetings).toBe(4);
      expect(result.lastFiveMeetings).toHaveLength(4); // Only 4 matches
    });

    it('should limit to last 5 meetings', () => {
      const matches = createH2HMatches([
        { homeTeam: 1, awayTeam: 2, homeScore: 3, awayScore: 1 },
        { homeTeam: 2, awayTeam: 1, homeScore: 2, awayScore: 2 },
        { homeTeam: 1, awayTeam: 2, homeScore: 1, awayScore: 2 },
        { homeTeam: 2, awayTeam: 1, homeScore: 0, awayScore: 1 },
        { homeTeam: 1, awayTeam: 2, homeScore: 2, awayScore: 0 },
        { homeTeam: 2, awayTeam: 1, homeScore: 1, awayScore: 1 }, // Should be included (most recent)
        { homeTeam: 1, awayTeam: 2, homeScore: 4, awayScore: 0 }, // Should not be included (oldest)
      ]);

      const result = service.analyzeHeadToHead(matches, 1, 2);

      expect(result.lastFiveMeetings).toHaveLength(5);
      expect(result.totalMeetings).toBe(7);
    });

    it('should handle no previous meetings', () => {
      const result = service.analyzeHeadToHead([], 1, 2);

      expect(result.homeWins).toBe(0);
      expect(result.awayWins).toBe(0);
      expect(result.draws).toBe(0);
      expect(result.totalMeetings).toBe(0);
      expect(result.lastFiveMeetings).toHaveLength(0);
    });

    it('should correctly identify result from both team perspectives', () => {
      const matches = createH2HMatches([
        // When team 1 is home and wins
        { homeTeam: 1, awayTeam: 2, homeScore: 3, awayScore: 1 },
        // When team 1 is away and wins
        { homeTeam: 2, awayTeam: 1, homeScore: 0, awayScore: 2 },
      ]);

      const result = service.analyzeHeadToHead(matches, 1, 2);

      expect(result.homeWins).toBe(2); // Both are wins for team 1
      expect(result.awayWins).toBe(0);
    });
  });

  describe('calculateDefensiveRating', () => {
    it('should calculate strong defensive rating', () => {
      const stats = {
        played: 10,
        goalsAgainst: 5,
        cleanSheets: 6,
        wins: 7,
        draws: 2,
        losses: 1,
      };

      const rating = service['calculateDefensiveRating'](stats);

      // Low goals against + high clean sheets + good results
      expect(rating).toBeGreaterThan(70);
    });

    it('should calculate weak defensive rating', () => {
      const stats = {
        played: 10,
        goalsAgainst: 25,
        cleanSheets: 0,
        wins: 2,
        draws: 1,
        losses: 7,
      };

      const rating = service['calculateDefensiveRating'](stats);

      // High goals against + no clean sheets + poor results
      expect(rating).toBeLessThan(40);
    });
  });

  describe('calculateAttackingRating', () => {
    it('should calculate strong attacking rating', () => {
      const stats = {
        played: 10,
        goalsFor: 30,
        wins: 8,
        draws: 1,
        losses: 1,
      };

      const rating = service['calculateAttackingRating'](stats);

      // High goals for + many wins
      expect(rating).toBeGreaterThan(70);
    });

    it('should calculate weak attacking rating', () => {
      const stats = {
        played: 10,
        goalsFor: 5,
        wins: 1,
        draws: 2,
        losses: 7,
      };

      const rating = service['calculateAttackingRating'](stats);

      // Low goals for + few wins
      expect(rating).toBeLessThan(40);
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
      match.homeTeamId = config.isHome ? 1 : 2;
      match.awayTeamId = config.isHome ? 2 : 1;
      match.homeScore = config.homeScore;
      match.awayScore = config.awayScore;
      match.kickOff = new Date(2024, 0, index + 1);
      match.status = 'FINISHED';

      const homeTeam = new Team();
      homeTeam.id = match.homeTeamId;
      homeTeam.name = config.isHome ? 'Test Team' : 'Opponent';
      homeTeam.id = match.homeTeamId;
      match.homeTeam = homeTeam;

      const awayTeam = new Team();
      awayTeam.id = match.awayTeamId;
      awayTeam.name = config.isHome ? 'Opponent' : 'Test Team';
      awayTeam.id = match.awayTeamId;
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
      match.homeTeamId = config.homeTeam;
      match.awayTeamId = config.awayTeam;
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
