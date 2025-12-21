import { InsightsGeneratorService } from './insights-generator.service';

describe('InsightsGeneratorService', () => {
  let service: InsightsGeneratorService;

  beforeEach(() => {
    service = new InsightsGeneratorService();
  });

  it('generates match insights for strong home form and h2h dominance', () => {
    const insights = service.generateMatchInsights({
      homeForm: { formRating: 85, recentForm: 'W-W-W' } as any,
      awayForm: { formRating: 25, recentForm: 'L-L-L' } as any,
      homeStats: { played: 4, goalsFor: 12, goalsAgainst: 2 } as any,
      awayStats: { played: 4, goalsFor: 1, goalsAgainst: 5 } as any,
      h2h: { homeWins: 3, awayWins: 0, draws: 1 } as any,
      homeTeamName: 'HomeFC',
      awayTeamName: 'AwayFC',
    });

    // Expect multiple insights including form, h2h dominance, scoring and win streak
    expect(insights.some((s) => s.includes('excellent form'))).toBe(true);
    expect(insights.some((s) => s.includes('dominated recent meetings'))).toBe(true);
    expect(insights.some((s) => s.includes('prolific scorers'))).toBe(true);
    expect(insights.some((s) => s.includes('winning streak'))).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('determines confidence levels correctly', () => {
    expect(
      service.determineConfidence({ homeMatchCount: 1, awayMatchCount: 5, h2hCount: 0, formConsistency: 50 }),
    ).toBe('low');

    expect(
      service.determineConfidence({ homeMatchCount: 12, awayMatchCount: 11, h2hCount: 4, formConsistency: 80 }),
    ).toBe('high');

    expect(
      service.determineConfidence({ homeMatchCount: 5, awayMatchCount: 5, h2hCount: 0, formConsistency: 50 }),
    ).toBe('medium');
  });
});
