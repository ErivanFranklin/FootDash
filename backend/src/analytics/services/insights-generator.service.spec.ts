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

  // Tests for generateTeamInsights method to cover uncovered lines
  describe('generateTeamInsights', () => {
    it('generates insights for excellent team form', () => {
      const insights = service.generateTeamInsights({
        teamName: 'TestFC',
        formRating: 85,
        homeStats: { winPercentage: 85 } as any,
        awayStats: { winPercentage: 60 } as any, // 25% difference (>20)
        overallStats: { winPercentage: 70, goalDifference: 25 } as any,
        scoringTrend: { trend: 'up', average: 2.5 },
      });

      expect(insights.some(s => s.includes('TestFC are in excellent form'))).toBe(true);
      expect(insights.some(s => s.includes('Much stronger at home'))).toBe(true);
      expect(insights.some(s => s.includes('Goals scoring is trending upward'))).toBe(true);
      expect(insights.some(s => s.includes('Exceptional goal difference'))).toBe(true);
      expect(insights.some(s => s.includes('Impressive'))).toBe(true);
    });

    it('generates insights for struggling team form', () => {
      const insights = service.generateTeamInsights({
        teamName: 'PoorFC',
        formRating: 20,
        homeStats: { winPercentage: 30 } as any,
        awayStats: { winPercentage: 60 } as any,
        overallStats: { winPercentage: 25, goalDifference: -25 } as any,
        scoringTrend: { trend: 'down', average: 0.8 },
      });

      expect(insights.some(s => s.includes('PoorFC are struggling for form'))).toBe(true);
      expect(insights.some(s => s.includes('Surprisingly better away from home'))).toBe(true);
      expect(insights.some(s => s.includes('Struggling to find the net recently'))).toBe(true);
      expect(insights.some(s => s.includes('Poor goal difference'))).toBe(true);
      expect(insights.some(s => s.includes('Struggling with only'))).toBe(true);
    });

    it('generates insights for stable scoring trend', () => {
      const insights = service.generateTeamInsights({
        teamName: 'StableFC',
        formRating: 50,
        homeStats: { winPercentage: 50 } as any,
        awayStats: { winPercentage: 50 } as any,
        overallStats: { winPercentage: 50, goalDifference: 5 } as any,
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      // Should not include form, home/away advantage, scoring trend, goal difference, or win percentage insights
      expect(insights.some(s => s.includes('excellent form'))).toBe(false);
      expect(insights.some(s => s.includes('struggling for form'))).toBe(false);
      expect(insights.some(s => s.includes('stronger at home'))).toBe(false);
      expect(insights.some(s => s.includes('better away'))).toBe(false);
      expect(insights.some(s => s.includes('trending'))).toBe(false);
      expect(insights.some(s => s.includes('Struggling to find'))).toBe(false);
      expect(insights.some(s => s.includes('goal difference'))).toBe(false);
      expect(insights.some(s => s.includes('win rate'))).toBe(false);
    });

    it('limits team insights to maximum of 5', () => {
      const insights = service.generateTeamInsights({
        teamName: 'MaxFC',
        formRating: 85,
        homeStats: { winPercentage: 90 } as any,
        awayStats: { winPercentage: 40 } as any,
        overallStats: { winPercentage: 75, goalDifference: 30 } as any,
        scoringTrend: { trend: 'up', average: 3.2 },
      });

      expect(insights.length).toBeLessThanOrEqual(5);
    });

    it('handles edge cases for home vs away performance', () => {
      const insights1 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 70 } as any,
        awayStats: { winPercentage: 49 } as any, // Exactly 21% difference
        overallStats: { winPercentage: 50, goalDifference: 0 } as any,
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights1.some(s => s.includes('Much stronger at home'))).toBe(true);

      const insights2 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 49 } as any,
        awayStats: { winPercentage: 70 } as any, // Exactly 21% difference
        overallStats: { winPercentage: 50, goalDifference: 0 } as any,
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights2.some(s => s.includes('Surprisingly better away from home'))).toBe(true);
    });

    it('handles edge cases for goal difference', () => {
      const insights1 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 50 } as any,
        awayStats: { winPercentage: 50 } as any,
        overallStats: { winPercentage: 50, goalDifference: 21 } as any, // Exactly 21
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights1.some(s => s.includes('Exceptional goal difference'))).toBe(true);

      const insights2 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 50 } as any,
        awayStats: { winPercentage: 50 } as any,
        overallStats: { winPercentage: 50, goalDifference: -21 } as any, // Exactly -21
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights2.some(s => s.includes('Poor goal difference'))).toBe(true);
    });

    it('handles edge cases for win percentage', () => {
      const insights1 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 50 } as any,
        awayStats: { winPercentage: 50 } as any,
        overallStats: { winPercentage: 61, goalDifference: 0 } as any, // Exactly 61%
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights1.some(s => s.includes('Impressive'))).toBe(true);

      const insights2 = service.generateTeamInsights({
        teamName: 'EdgeFC',
        formRating: 50,
        homeStats: { winPercentage: 50 } as any,
        awayStats: { winPercentage: 50 } as any,
        overallStats: { winPercentage: 29, goalDifference: 0 } as any, // Exactly 29%
        scoringTrend: { trend: 'stable', average: 1.5 },
      });

      expect(insights2.some(s => s.includes('Struggling with only'))).toBe(true);
    });
  });

  // Additional tests for match insights to cover more uncovered lines
  describe('generateMatchInsights - additional coverage', () => {
    it('generates insights for away team excellent form', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 40, recentForm: 'D-L-W' } as any,
        awayForm: { formRating: 80, recentForm: 'W-W-D' } as any,
        homeStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        awayStats: { played: 4, goalsFor: 8, goalsAgainst: 2 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('AwayFC are in excellent form'))).toBe(true);
    });

    it('generates insights for struggling teams', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 20, recentForm: 'L-L-D' } as any,
        awayForm: { formRating: 15, recentForm: 'L-L-L' } as any,
        homeStats: { played: 4, goalsFor: 2, goalsAgainst: 8 } as any,
        awayStats: { played: 4, goalsFor: 1, goalsAgainst: 10 } as any,
        h2h: { homeWins: 0, awayWins: 0, draws: 2 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('HomeFC are struggling with recent form'))).toBe(true);
      expect(insights.some((s) => s.includes('AwayFC are struggling with recent form'))).toBe(true);
    });

    it('generates head-to-head insights for away team dominance', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        awayStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        h2h: { homeWins: 0, awayWins: 4, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('AwayFC have the upper hand historically'))).toBe(true);
    });

    it('generates insights for closely contested matches', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        awayStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 4 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('Recent meetings have been closely contested'))).toBe(true);
    });

    it('generates defensive insights for strong defenses', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 10, goalsFor: 15, goalsAgainst: 3 } as any,
        awayStats: { played: 10, goalsFor: 12, goalsAgainst: 7 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('HomeFC have a strong defense'))).toBe(true);
      expect(insights.some((s) => s.includes('AwayFC have a solid defense'))).toBe(true);
    });

    it('generates defensive insights for poor defenses', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 10, goalsFor: 15, goalsAgainst: 25 } as any,
        awayStats: { played: 10, goalsFor: 12, goalsAgainst: 22 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('HomeFC have defensive concerns'))).toBe(true);
      expect(insights.some((s) => s.includes('AwayFC have been leaking goals'))).toBe(true);
    });

    it('generates away team winning streak insight', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 40, recentForm: 'D-L-W' } as any,
        awayForm: { formRating: 80, recentForm: 'W-W-W-D-L' } as any,
        homeStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        awayStats: { played: 4, goalsFor: 8, goalsAgainst: 2 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('AwayFC are on a winning streak'))).toBe(true);
    });

    it('handles teams with no played matches', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 0, goalsFor: 0, goalsAgainst: 0 } as any,
        awayStats: { played: 0, goalsFor: 0, goalsAgainst: 0 } as any,
        h2h: { homeWins: 0, awayWins: 0, draws: 0 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      // Should not generate prolific scorer insights when no games played
      expect(insights.some((s) => s.includes('prolific scorers'))).toBe(false);
      // But defensive insights may still appear because defense = 0 when played = 0, and 0 < 0.8
      // So we expect the strong defense insights to be present
      expect(insights.some((s) => s.includes('strong defense'))).toBe(true);
    });

    it('handles teams with no head-to-head history', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 75, recentForm: 'W-W-D' } as any,
        awayForm: { formRating: 60, recentForm: 'W-D-L' } as any,
        homeStats: { played: 5, goalsFor: 10, goalsAgainst: 3 } as any,
        awayStats: { played: 5, goalsFor: 8, goalsAgainst: 5 } as any,
        h2h: { homeWins: 0, awayWins: 0, draws: 0 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      // Should not contain any h2h insights
      expect(insights.some((s) => s.includes('dominated recent meetings'))).toBe(false);
      expect(insights.some((s) => s.includes('upper hand historically'))).toBe(false);
      expect(insights.some((s) => s.includes('closely contested'))).toBe(false);
    });

    it('generates prolific scorer insights for away team', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        awayForm: { formRating: 50, recentForm: 'W-D-L' } as any,
        homeStats: { played: 4, goalsFor: 6, goalsAgainst: 4 } as any,
        awayStats: { played: 4, goalsFor: 12, goalsAgainst: 4 } as any,
        h2h: { homeWins: 1, awayWins: 1, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.some((s) => s.includes('AwayFC are prolific scorers'))).toBe(true);
    });

    it('limits insights to maximum of 5', () => {
      const insights = service.generateMatchInsights({
        homeForm: { formRating: 85, recentForm: 'W-W-W-W-W' } as any,
        awayForm: { formRating: 85, recentForm: 'W-W-W-W-W' } as any,
        homeStats: { played: 10, goalsFor: 30, goalsAgainst: 3 } as any,
        awayStats: { played: 10, goalsFor: 28, goalsAgainst: 5 } as any,
        h2h: { homeWins: 5, awayWins: 0, draws: 1 } as any,
        homeTeamName: 'HomeFC',
        awayTeamName: 'AwayFC',
      });

      expect(insights.length).toBeLessThanOrEqual(5);
    });
  });
});
