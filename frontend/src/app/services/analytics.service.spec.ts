import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AnalyticsService } from './analytics.service';
import { LoggerService } from '../core/services/logger.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  const loggerMock = {
    error: jasmine.createSpy('error'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: LoggerService, useValue: loggerMock }],
    });

    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
    loggerMock.error.calls.reset();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('caches and reuses match predictions', () => {
    let first: any;
    let second: any;

    service.getMatchPrediction(10).subscribe((v) => (first = v));
    const req = httpMock.expectOne('/api/analytics/match/10/prediction');
    expect(req.request.method).toBe('GET');
    req.flush({
      homeWinProbability: 0.4,
      drawProbability: 0.3,
      awayWinProbability: 0.3,
    });

    service.getMatchPrediction(10).subscribe((v) => (second = v));
    httpMock.expectNone('/api/analytics/match/10/prediction');

    expect(first.homeWinProbability).toBe(0.4);
    expect(second.homeWinProbability).toBe(0.4);
  });

  it('generates a new prediction and refreshes cache', () => {
    service.generatePrediction(11).subscribe();

    const req = httpMock.expectOne('/api/analytics/match/11/predict');
    expect(req.request.method).toBe('POST');
    req.flush({
      homeWinProbability: 0.5,
      drawProbability: 0.2,
      awayWinProbability: 0.3,
    });

    service.getMatchPrediction(11).subscribe();
    httpMock.expectNone('/api/analytics/match/11/prediction');
  });

  it('sends upcoming prediction and stats query params', () => {
    service.getUpcomingPredictions(9).subscribe();
    const upcoming = httpMock.expectOne(
      (r) =>
        r.url === '/api/analytics/upcoming-predictions' &&
        r.params.get('limit') === '9',
    );
    expect(upcoming.request.method).toBe('GET');
    upcoming.flush([]);

    service.getPredictionStats('ml', 25).subscribe();
    const stats = httpMock.expectOne(
      (r) =>
        r.url === '/api/analytics/predictions/stats' &&
        r.params.get('strategy') === 'ml' &&
        r.params.get('limit') === '25',
    );
    expect(stats.request.method).toBe('GET');
    stats.flush({});
  });

  it('returns fallback BTTS and over-under payloads on errors', () => {
    let btts: any;
    let ou: any;

    service.getBttsPrediction(12).subscribe((v) => (btts = v));
    const bttsReq = httpMock.expectOne('/api/analytics/match/12/prediction/btts');
    bttsReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });

    service.getOverUnderPrediction(13, 3.5).subscribe((v) => (ou = v));
    const ouReq = httpMock.expectOne(
      (r) =>
        r.url === '/api/analytics/match/13/prediction/over-under' &&
        r.params.get('line') === '3.5',
    );
    ouReq.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });

    expect(btts.confidence).toBe('low');
    expect(ou.confidence).toBe('low');
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('normalizes team analytics response and uses cache on subsequent request', () => {
    let first: any;
    let second: any;

    service.getTeamAnalytics(5).subscribe((v) => (first = v));
    const req = httpMock.expectOne('/api/analytics/team/5');
    req.flush({
      formRating: '82',
      defensiveRating: '70',
      overallStats: { wins: '10', draws: '3', losses: '2', goalsScored: '25', goalsConceded: '11' },
      homePerformance: {},
      awayPerformance: {},
      scoringTrend: { last5: [1, 2, 0], average: '1.0' },
    });

    expect(first.formRating).toBe(82);
    expect(first.overallStats.won).toBe(10);
    expect(first.overallStats.points).toBe(33);
    expect(first.scoringTrend.last5Matches.length).toBe(3);

    service.getTeamAnalytics(5).subscribe((v) => (second = v));
    httpMock.expectNone('/api/analytics/team/5');
    expect(second.formRating).toBe(82);
  });

  it('normalizes team comparison response and caches it', () => {
    let result: any;

    service.compareTeams(1, 2).subscribe((v) => (result = v));
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/analytics/team/compare' &&
        r.params.get('team1') === '1' &&
        r.params.get('team2') === '2',
    );
    req.flush({
      homeTeam: { overallStats: {} },
      awayTeam: { overallStats: {} },
      headToHead: { homeWins: '3', draws: '2', awayWins: '1' },
    });

    expect(result.headToHead.totalMeetings).toBe(6);
    expect(result.headToHead.homeWins).toBe(3);

    service.compareTeams(1, 2).subscribe();
    httpMock.expectNone((r) => r.url === '/api/analytics/team/compare');
  });

  it('requests team form and refreshes analytics while clearing cache', () => {
    (service as any).cache.set('x', { data: 1, timestamp: Date.now() });

    service.getTeamForm(7, 8).subscribe();
    const formReq = httpMock.expectOne(
      (r) =>
        r.url === '/api/analytics/team/7/form' &&
        r.params.get('lastN') === '8',
    );
    formReq.flush({});

    service.refreshAllAnalytics().subscribe();
    const refreshReq = httpMock.expectOne('/api/analytics/team/refresh-all');
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({ message: 'ok', updated: 2 });

    expect((service as any).cache.size).toBe(0);
  });

  it('covers helper methods for confidence, outcome and form formatting', () => {
    expect(service.getConfidenceColor('high')).toBe('success');
    expect(service.getConfidenceColor('medium')).toBe('warning');
    expect(service.getConfidenceColor('low')).toBe('danger');
    expect(service.getConfidenceText('medium')).toBe('MEDIUM');
    expect(service.formatFormString('WDL')).toBe('W-D-L');
    expect(service.getFormBadgeColor('W')).toBe('success');
    expect(service.getFormBadgeColor('D')).toBe('warning');
    expect(service.getFormBadgeColor('L')).toBe('danger');

    expect(
      service.getMostLikelyOutcome({
        homeWinProbability: 0.6,
        drawProbability: 0.2,
        awayWinProbability: 0.2,
      } as any).type,
    ).toBe('home');
    expect(
      service.getMostLikelyOutcome({
        homeWinProbability: 0.1,
        drawProbability: 0.2,
        awayWinProbability: 0.7,
      } as any).type,
    ).toBe('away');
    expect(
      service.getMostLikelyOutcome({
        homeWinProbability: 0.3,
        drawProbability: 0.4,
        awayWinProbability: 0.3,
      } as any).type,
    ).toBe('draw');
  });
});