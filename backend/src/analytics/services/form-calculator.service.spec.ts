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
        { homeScore: 1, awayScore: 0, isHome: false }, // Win: 3 points
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
        { homeScore: 1, awayScore: 3, isHome: false }, // Loss: 0 points
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
        { homeScore: 1, awayScore: 0, isHome: false },
        { homeScore: 4, awayScore: 1, isHome: true },
        { homeScore: 2, awayScore: 0, isHome: false },
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
        { homeScore: 1, awayScore: 3, isHome: false }, // Win (team is away, scored 3)
        { homeScore: 2, awayScore: 0, isHome: false }, // Loss (team is away, scored 0)
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
        { homeScore: 3, awayScore: 0, isHome: true }, // Win (most recent)
        { homeScore: 2, awayScore: 1, isHome: true }, // Win
        { homeScore: 1, awayScore: 1, isHome: false }, // Draw
        { homeScore: 0, awayScore: 1, isHome: true }, // Loss
        { homeScore: 1, awayScore: 2, isHome: false }, // Loss (oldest)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.trend).toContain('improving');
    });

    it('should identify declining trend', () => {
      const matches = createMockMatches([
        { homeScore: 0, awayScore: 2, isHome: true }, // Loss (most recent)
        { homeScore: 1, awayScore: 1, isHome: true }, // Draw
        { homeScore: 2, awayScore: 1, isHome: false }, // Win
        { homeScore: 3, awayScore: 0, isHome: true }, // Win
        { homeScore: 2, awayScore: 1, isHome: false }, // Win (oldest)
      ]);

      const result = service.calculateForm(matches, 1, 5);

      expect(result.trend).toContain('declining');
    });
  });

  // Helper function to create mock matches
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
      match.homeTeamId = config.isHome ? 1 : 2;
      match.awayTeamId = config.isHome ? 2 : 1;
      match.homeScore = config.homeScore;
      match.awayScore = config.awayScore;
      match.kickOff = new Date(2024, 0, index + 1); // Sequential dates
      match.status = 'FINISHED';

      const homeTeam = new Team();
      homeTeam.id = match.homeTeamId;
      homeTeam.name = config.isHome ? 'Test Team' : 'Opponent Team';
      match.homeTeam = homeTeam;

      const awayTeam = new Team();
      awayTeam.id = match.awayTeamId;
      awayTeam.name = config.isHome ? 'Opponent Team' : 'Test Team';
      match.awayTeam = awayTeam;

      return match;
    });
  }
});
