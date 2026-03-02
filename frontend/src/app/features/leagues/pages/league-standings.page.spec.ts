import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { LeagueStandingsPage } from './league-standings.page';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiBaseUrl;

describe('LeagueStandingsPage', () => {
  let component: LeagueStandingsPage;
  let fixture: ComponentFixture<LeagueStandingsPage>;
  let httpMock: HttpTestingController;

  const mockRoute = {
    snapshot: { paramMap: { get: jest.fn().mockReturnValue('39') } },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueStandingsPage, HttpClientTestingModule],
      providers: [{ provide: ActivatedRoute, useValue: mockRoute }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LeagueStandingsPage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  function flushInit(standings: any[] = [], leagueInfo: any = { name: 'Premier League' }) {
    httpMock.expectOne(`${BASE}/leagues/39/standings`).flush(standings);
    httpMock.expectOne(`${BASE}/leagues/39`).flush(leagueInfo);
  }

  it('should create', () => {
    fixture.detectChanges();
    flushInit();
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('extracts leagueId from route params', () => {
      fixture.detectChanges();
      flushInit();
      expect(component['leagueId']).toBe(39);
    });

    it('calls GET /leagues/:id/standings on init', () => {
      fixture.detectChanges();
      const standingsReq = httpMock.expectOne(`${BASE}/leagues/39/standings`);
      expect(standingsReq.request.method).toBe('GET');
      httpMock.expectOne(`${BASE}/leagues/39`).flush({ name: 'PL' });
      standingsReq.flush([]);
    });

    it('calls GET /leagues/:id for league info on init', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${BASE}/leagues/39/standings`).flush([]);
      const infoReq = httpMock.expectOne(`${BASE}/leagues/39`);
      expect(infoReq.request.method).toBe('GET');
      infoReq.flush({ name: 'Premier League' });
    });
  });

  // ── data population ───────────────────────────────────────────────────────

  describe('data population', () => {
    const mockStandings = [
      {
        rank: 1,
        team: { id: 42, name: 'Arsenal', logo: null },
        points: 65,
        goalsDiff: 28,
        all: { played: 26, win: 20, draw: 5, lose: 1, goals: { for: 60, against: 32 } },
      },
    ];

    it('populates standings signal', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${BASE}/leagues/39/standings`).flush(mockStandings);
      httpMock.expectOne(`${BASE}/leagues/39`).flush({ name: 'PL' });

      expect(component.standings()).toEqual(mockStandings);
    });

    it('populates leagueName signal from league info', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${BASE}/leagues/39/standings`).flush([]);
      httpMock.expectOne(`${BASE}/leagues/39`).flush({ name: 'Premier League' });

      expect(component.leagueName()).toBe('Premier League');
    });

    it('starts with empty standings', () => {
      expect(component.standings()).toEqual([]);
    });
  });
});
