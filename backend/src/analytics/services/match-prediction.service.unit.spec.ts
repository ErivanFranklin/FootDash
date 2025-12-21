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
    expect(result.draw).toBeLessThanOrEqual(30);
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
});
