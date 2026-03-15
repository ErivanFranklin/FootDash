import { MatchPredictionService } from './match-prediction.service';

describe('MatchPredictionService (unit)', () => {
  let svc: any;

  beforeEach(() => {
    // Create a bare object with the MatchPredictionService prototype so we can
    // call the private calculateProbabilities method without constructing the full service.
    svc = Object.create(MatchPredictionService.prototype);
    // Set HOME_ADVANTAGE used in calculations
    svc.HOME_ADVANTAGE = 10;
  });

  it('calculateProbabilities returns reasonable probabilities and sum ~100', () => {
    const result = svc.calculateProbabilities({
      homeFormRating: 70,
      awayFormRating: 60,
      homeWinRate: 50,
      awayWinRate: 40,
      h2hHomeWins: 2,
      h2hAwayWins: 1,
      h2hDraws: 1,
    });

    expect(result.homeWin + result.draw + result.awayWin).toBeCloseTo(100, 1);
    expect(result.draw).toBeGreaterThanOrEqual(15);
    expect(result.draw).toBeLessThanOrEqual(40);
  });

  it('calculateProbabilities with high ratings difference results in low draw prob', () => {
    const result = svc.calculateProbabilities({
      homeFormRating: 150, // Extreme difference
      awayFormRating: 0,
      homeWinRate: 100,
      awayWinRate: 0,
      h2hHomeWins: 20,
      h2hAwayWins: 0,
      h2hDraws: 0,
    });

    expect(result.draw).toBe(15); 
    expect(result.homeWin).toBeGreaterThan(80);
  });

  it('calculateProbabilities with equal ratings results in higher draw prob', () => {
    const result = svc.calculateProbabilities({
      homeFormRating: 50,
      awayFormRating: 50,  // no difference
      homeWinRate: 50,
      awayWinRate: 50,
      h2hHomeWins: 1,
      h2hAwayWins: 1,
      h2hDraws: 1,
    });

    expect(result.draw).toBeGreaterThan(30); // 100 - 65 = 35
  });

  it('calculateProbabilities respects head-to-head adjustments', () => {
    const noH2H = svc.calculateProbabilities({
      homeFormRating: 70,
      awayFormRating: 70,
      homeWinRate: 40,
      awayWinRate: 40,
      h2hHomeWins: 0,
      h2hAwayWins: 0,
      h2hDraws: 0,
    });

    const homeFavH2H = svc.calculateProbabilities({
      homeFormRating: 70,
      awayFormRating: 70,
      homeWinRate: 40,
      awayWinRate: 40,
      h2hHomeWins: 4,
      h2hAwayWins: 0,
      h2hDraws: 0,
    });

    // With dominant h2h home should have larger homeWin than noH2H
    expect(homeFavH2H.homeWin).toBeGreaterThan(noH2H.homeWin);
  });

  it('isPredictionFresh returns true for recent predictions', () => {
    const recent = new Date();
    recent.setHours(recent.getHours() - 1);
    expect(svc.isPredictionFresh({ updatedAt: recent })).toBeTruthy();

    const old = new Date();
    old.setHours(old.getHours() - 25);
    expect(svc.isPredictionFresh({ updatedAt: old })).toBeFalsy();
  });

  it('mapToDto properly maps database entity to result object', () => {
    const entity = {
      matchId: 1,
      match: {
        homeTeam: { name: 'Home' },
        awayTeam: { name: 'Away' },
      },
      homeWinProbability: 50,
      drawProbability: 20,
      awayWinProbability: 30,
      confidence: 'high',
      insights: ['test'],
    };
    const result = svc.mapToDto(entity as any);
    expect(result.homeWinProbability).toBe(50);
    expect(result.drawProbability).toBe(20);
    expect(result.awayWinProbability).toBe(30);
    expect(result.homeTeam).toBe('Home');
    expect(result.awayTeam).toBe('Away');
  });
});
