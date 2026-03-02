import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { OddsPage } from './odds.page';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiBaseUrl}/odds`;

describe('OddsPage', () => {
  let component: OddsPage;
  let fixture: ComponentFixture<OddsPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OddsPage, HttpClientTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OddsPage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(API).flush([]);
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / loadOdds ─────────────────────────────────────────────────

  describe('loadOdds', () => {
    const mockOdds = [
      { id: 1, matchId: 10, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'Bet365', homeWin: 1.9, draw: 3.4, awayWin: 4.2, over25: 1.8, under25: 2.0, bttsYes: 1.75, bttsNo: 2.05 },
      { id: 2, matchId: 10, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'William Hill', homeWin: 1.85, draw: 3.5, awayWin: 4.33, over25: 1.83, under25: 1.97, bttsYes: 1.80, bttsNo: 2.0 },
    ];

    it('calls GET /odds on init', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush(mockOdds);
    });

    it('populates odds signal', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush(mockOdds);
      expect(component.odds()).toEqual(mockOdds);
    });

    it('sets loading to false after response', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush([]);
      expect(component.loading()).toBe(false);
    });
  });

  // ── groupOdds ───────────────────────────────────────────────────────────

  describe('groupedOdds', () => {
    it('groups entries by matchId', () => {
      const mockOdds = [
        { id: 1, matchId: 10, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'Bet365', homeWin: 1.9, draw: 3.4, awayWin: 4.2, over25: null, under25: null, bttsYes: null, bttsNo: null },
        { id: 2, matchId: 10, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'William Hill', homeWin: 1.85, draw: 3.5, awayWin: 4.33, over25: null, under25: null, bttsYes: null, bttsNo: null },
        { id: 3, matchId: 11, homeTeam: 'Liverpool', awayTeam: 'Man City', matchDate: '2025-02-02', bookmaker: 'Bet365', homeWin: 2.1, draw: 3.3, awayWin: 3.5, over25: null, under25: null, bttsYes: null, bttsNo: null },
      ];
      fixture.detectChanges();
      httpMock.expectOne(API).flush(mockOdds);

      const groups = component.groupedOdds();
      expect(groups.length).toBe(2);
      const arsenalGroup = groups.find((g) => g.matchId === 10);
      expect(arsenalGroup?.entries.length).toBe(2);
    });
  });

  // ── isBest ──────────────────────────────────────────────────────────────

  describe('isBest', () => {
    it('returns true for highest homeWin value', () => {
      const entries: any[] = [
        { id: 1, homeWin: 2.0 },
        { id: 2, homeWin: 1.85 },
      ];
      expect(component.isBest(entries, 'homeWin', 2.0)).toBe(true);
    });

    it('returns false for non-best homeWin value', () => {
      const entries: any[] = [
        { id: 1, homeWin: 2.0 },
        { id: 2, homeWin: 1.85 },
      ];
      expect(component.isBest(entries, 'homeWin', 1.85)).toBe(false);
    });

    it('returns false when there is only one entry', () => {
      const entries: any[] = [{ id: 1, homeWin: 2.0 }];
      expect(component.isBest(entries, 'homeWin', 2.0)).toBe(false);
    });
  });

  // ── onTabChange / value bets ────────────────────────────────────────────

  describe('onTabChange to value tab', () => {
    it('fetches value bets when switching to value tab', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush([]);

      component.activeTab = 'value';
      component.onTabChange();
      const req = httpMock.expectOne(`${API}/value-bets`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('does not re-fetch value bets if already loaded', () => {
      fixture.detectChanges();
      httpMock.expectOne(API).flush([]);

      // Pre-populate value bets
      component.valueBets.set([{ matchId: 1, market: 'Home Win', edge: 12 } as any]);
      component.activeTab = 'value';
      component.onTabChange();
      httpMock.expectNone(`${API}/value-bets`);
    });
  });
});
