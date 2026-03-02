import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GamificationService, BadgeResponse, LeaderboardEntry } from './gamification.service';
import { environment } from '../../environments/environment';

describe('GamificationService', () => {
  let service: GamificationService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/gamification`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(GamificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('submitPrediction', () => {
    it('POSTs to /gamification/predict and returns PredictionWithBadges', (done) => {
      const mockResponse = {
        prediction: { id: 1, userId: 1, matchId: 5, homeScore: 2, awayScore: 1 },
        newBadges: [] as BadgeResponse[],
      };

      service.submitPrediction(5, 2, 1).subscribe((res) => {
        expect(res.prediction.matchId).toBe(5);
        expect(res.newBadges).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${base}/predict`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ matchId: 5, homeScore: 2, awayScore: 1 });
      req.flush(mockResponse);
    });
  });

  describe('getLeaderboard', () => {
    it('GETs /gamification/leaderboard with period param', (done) => {
      const mockEntries: LeaderboardEntry[] = [
        { rank: 1, userId: 1, userName: 'Alice', points: 150 },
        { rank: 2, userId: 2, userName: 'Bob', points: 120 },
      ];

      service.getLeaderboard('monthly').subscribe((res) => {
        expect(res).toHaveSize(2);
        expect(res[0].userName).toBe('Alice');
        done();
      });

      const req = httpMock.expectOne(`${base}/leaderboard?period=monthly`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });

    it('defaults to weekly period', (done) => {
      service.getLeaderboard().subscribe(() => done());
      const req = httpMock.expectOne(`${base}/leaderboard?period=weekly`);
      req.flush([]);
    });
  });

  describe('getAllBadges', () => {
    it('GETs /gamification/badges', (done) => {
      const mockBadges: BadgeResponse[] = [
        {
          id: 1, name: 'First Prediction', description: 'Submit your first prediction',
          iconUrl: '', slug: 'first-prediction', tier: 'bronze',
          criteriaType: 'first_prediction', threshold: 1, sortOrder: 1,
          unlocked: true, unlockedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      service.getAllBadges().subscribe((res) => {
        expect(res).toHaveSize(1);
        expect(res[0].tier).toBe('bronze');
        done();
      });

      const req = httpMock.expectOne(`${base}/badges`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBadges);
    });
  });

  describe('getUserBadges', () => {
    it('GETs /gamification/badges/user/:id for a given userId', (done) => {
      service.getUserBadges(42).subscribe(() => done());
      const req = httpMock.expectOne(`${base}/badges/user/42`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('checkBadges', () => {
    it('POSTs to /gamification/badges/check', (done) => {
      service.checkBadges().subscribe(() => done());
      const req = httpMock.expectOne(`${base}/badges/check`);
      expect(req.request.method).toBe('POST');
      req.flush([]);
    });
  });
});
