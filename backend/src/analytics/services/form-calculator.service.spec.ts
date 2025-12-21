import { Test, TestingModule } from '@nestjs/testing';
import { FormCalculatorService } from './form-calculator.service';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';

describe('FormCalculatorService', () => {
  let service: FormCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormCalculatorService],
    }).compile();

    service = module.get<FormCalculatorService>(FormCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateForm', () => {
    it('should calculate form rating correctly for winning team', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 1, isHome: true }, // Win: 3 points
        { homeScore: 2, awayScore: 2, isHome: true }, // Draw: 1 point
        { homeScore: 0, awayScore: 1, isHome: false }, // Win: 3 points (Team 1 is away, awayScore 1 > homeScore 0)
        { homeScore: 2, awayScore: 1, isHome: true }, // Win: 3 points
        { homeScore: 1, awayScore: 1, isHome: false }, // Draw: 1 point
      ]);

      const result = service.calculateForm(matches, 1, 5);

      // Total: 3+1+3+3+1 = 11 points out of 15 possible
      // Rating: (11/15) * 100 = 73.33
      expect(result.formRating).toBeCloseTo(73.33, 1);
      expect(result.matches).toHaveLength(5);
      expect(result.form).toBe('WDWWD');
      expect(result.trend).toContain('consistent');
    });

    it('should calculate form rating correctly for losing team', () => {
      const matches = createMockMatches([
        { homeScore: 0, awayScore: 2, isHome: true }, // Loss: 0 points
        { homeScore: 2, awayScore: 1, isHome: false }, // Loss: 0 points (Team 1 is away, awayScore 1 < homeScore 2)
        { homeScore: 0, awayScore: 1, isHome: true }, // Loss: 0 points
      ]);

      const result = service.calculateForm(matches, 1, 5);

      // Total: 0 points out of 9 possible
      // Rating: 0
      expect(result.formRating).toBe(0);
      expect(result.form).toBe('LLL');
      expect(result.trend).toContain('poor');
    });

    it('should handle perfect form (all wins)', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 0, isHome: true },
        { homeScore: 2, awayScore: 1, isHome: true },
        { homeScore: 0, awayScore: 1, isHome: false },
        { homeScore: 4, awayScore: 1, isHome: true },
        { homeScore: 0, awayScore: 2, isHome: false },
      ]);

      const result = service.calculateForm(matches, 1, 5);

      // 15/15 points = 100%
      expect(result.formRating).toBe(100);
      expect(result.form).toBe('WWWWW');
      expect(result.trend).toContain('excellent');
    });

    it('should skip matches without scores', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 1, isHome: true },
        { homeScore: null, awayScore: null, isHome: true }, // Should skip
        { homeScore: 2, awayScore: 0, isHome: true },
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.matches).toHaveLength(2);
      expect(result.form).toBe('WW');
    });

    it('should handle away matches correctly', () => {
      const matches = createMockMatches([
        { homeScore: 1, awayScore: 3, isHome: false }, // Win (team is away, scored 3 > home 1)
        { homeScore: 2, awayScore: 0, isHome: false }, // Loss (team is away, scored 0 < home 2)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.form).toBe('WL');
      expect(result.formRating).toBeCloseTo(50, 0); // 3 out of 6 points
    });

    it('should limit to lastN matches', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 1, isHome: true },
        { homeScore: 2, awayScore: 2, isHome: true },
        { homeScore: 1, awayScore: 0, isHome: false },
        { homeScore: 2, awayScore: 1, isHome: true },
        { homeScore: 1, awayScore: 1, isHome: false },
        { homeScore: 3, awayScore: 0, isHome: true }, // Should not be included
        { homeScore: 1, awayScore: 2, isHome: true }, // Should not be included
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.matches).toHaveLength(5);
    });

    it('should return 50% rating when no matches available', () => {
      const result = service.calculateForm([], 1, 5);

      expect(result.formRating).toBe(50);
      expect(result.matches).toHaveLength(0);
      expect(result.form).toBe('');
      expect(result.trend).toContain('No recent matches');
    });

    it('should identify improving trend', () => {
      const matches = createMockMatches([
        { homeScore: 1, awayScore: 0, isHome: true }, // W (Newest)
        { homeScore: 2, awayScore: 0, isHome: true }, // W
        { homeScore: 0, awayScore: 1, isHome: true }, // L
        { homeScore: 0, awayScore: 2, isHome: true }, // L
        { homeScore: 0, awayScore: 3, isHome: true }, // L (Oldest)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.trend).toContain('improving');
    });

    it('should identify declining trend', () => {
      const matches = createMockMatches([
        { homeScore: 0, awayScore: 1, isHome: true }, // L (Newest)
        { homeScore: 0, awayScore: 2, isHome: true }, // L
        { homeScore: 1, awayScore: 0, isHome: true }, // W
        { homeScore: 2, awayScore: 0, isHome: true }, // W
        { homeScore: 3, awayScore: 0, isHome: true }, // W (Oldest)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.trend).toContain('declining');
    });

    it('should identify declining trend', () => {
      const matches = createMockMatches([
        { homeScore: 0, awayScore: 2, isHome: true }, // Loss (most recent)
        { homeScore: 1, awayScore: 1, isHome: true }, // Draw
        { homeScore: 1, awayScore: 2, isHome: false }, // Win (Team 1 is away, awayScore 2 > homeScore 1)
        { homeScore: 3, awayScore: 0, isHome: true }, // Win
        { homeScore: 1, awayScore: 2, isHome: false }, // Win (oldest)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.trend).toContain('declining');
    });
  });

  describe('calculateHomeForm', () => {
    it('should calculate form for home matches only', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 1, isHome: true }, // Home win
        { homeScore: 1, awayScore: 2, isHome: false }, // Away match (should be ignored)
        { homeScore: 2, awayScore: 0, isHome: true }, // Home win
        { homeScore: 0, awayScore: 1, isHome: true }, // Home loss
      ]);

      const result = service.calculateHomeForm(matches, 1, 5);

      // Should only consider home matches: WWL
      expect(result.matches).toHaveLength(3);
      expect(result.form).toBe('WWL');
    });
  });

  describe('calculateAwayForm', () => {
    it('should calculate form for away matches only', () => {
      const matches = createMockMatches([
        { homeScore: 1, awayScore: 3, isHome: false }, // Away win
        { homeScore: 3, awayScore: 1, isHome: true }, // Home match (should be ignored)
        { homeScore: 2, awayScore: 0, isHome: false }, // Away loss
        { homeScore: 0, awayScore: 1, isHome: false }, // Away win
      ]);

      const result = service.calculateAwayForm(matches, 1, 5);

      // Should only consider away matches: WLW
      expect(result.matches).toHaveLength(3);
      expect(result.form).toBe('WLW');
    });
  });

  describe('determineFormTrend', () => {
    it('should return stable for insufficient data', () => {
      expect(service.determineFormTrend([70])).toBe('stable');
      expect(service.determineFormTrend([])).toBe('stable');
    });

    it('should detect upward trend', () => {
      // First half: [30, 40] avg = 35, Second half: [60, 70] avg = 65, diff = 30 > 10
      const result = service.determineFormTrend([30, 40, 60, 70]);
      expect(result).toBe('up');
    });

    it('should detect downward trend', () => {
      // First half: [70, 80] avg = 75, Second half: [40, 50] avg = 45, diff = -30 < -10
      const result = service.determineFormTrend([70, 80, 40, 50]);
      expect(result).toBe('down');
    });

    it('should detect stable trend', () => {
      // First half: [50, 60] avg = 55, Second half: [55, 65] avg = 60, diff = 5 (not > 10 or < -10)
      const result = service.determineFormTrend([50, 60, 55, 65]);
      expect(result).toBe('stable');
    });

    it('should handle odd number of ratings', () => {
      // First half: [40] avg = 40, Second half: [50, 60] avg = 55, diff = 15 > 10
      const result = service.determineFormTrend([40, 50, 60]);
      expect(result).toBe('up');
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return low confidence for few matches', () => {
      expect(service.getConfidenceLevel(2, 10)).toBe('low');
      expect(service.getConfidenceLevel(1, 5)).toBe('low');
    });

    it('should return medium confidence for moderate matches', () => {
      expect(service.getConfidenceLevel(4, 20)).toBe('medium');
      expect(service.getConfidenceLevel(3, 15)).toBe('medium');
    });

    it('should return medium confidence for high variance', () => {
      expect(service.getConfidenceLevel(10, 35)).toBe('medium'); // High variance
      expect(service.getConfidenceLevel(8, 40)).toBe('medium'); // High variance
    });

    it('should return high confidence for many matches with low variance', () => {
      expect(service.getConfidenceLevel(10, 20)).toBe('high');
      expect(service.getConfidenceLevel(6, 15)).toBe('high');
    });
  });

  describe('edge cases and trend coverage', () => {
    it('should handle no recent matches trend', () => {
      const result = service.calculateForm([], 1, 5);
      expect(result.trend).toBe('No recent matches');
    });

    it('should cover line 108 with empty matches', () => {
      // This specifically tests the matchDetails.length === 0 condition on line 108
      const result = service.calculateForm([], 1, 5);
      expect(result.trend).toBe('No recent matches');
      expect(result.formRating).toBe(50);
      expect(result.form).toBe('');
    });

    it('should handle less than 4 matches for trend analysis', () => {
      const matches = createMockMatches([
        { homeScore: 3, awayScore: 1, isHome: true }, // Win (3 points)
        { homeScore: 2, awayScore: 2, isHome: true }, // Draw (1 point)
        { homeScore: 0, awayScore: 1, isHome: true }, // Loss (0 points)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      // Should not analyze trend with < 4 matches, should classify by rating
      // WDL = 4 points out of 9 = 44.44% -> 'consistent' category (40-74%)
      expect(result.trend).toBe('consistent');
    });
  });

  // Helper functions
  function createMockMatches(
    configs: Array<{
      homeScore: number | null;
      awayScore: number | null;
      isHome: boolean;
    }>,
  ): Match[] {
    return configs.map((config, index) => {
      const match = new Match();
      match.id = index + 1;
      match.homeScore = config.homeScore ?? undefined;
      match.awayScore = config.awayScore ?? undefined;
      match.kickOff = new Date(2024, 0, 10 - index); // Reverse chronological: Index 0 is newest
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
});
