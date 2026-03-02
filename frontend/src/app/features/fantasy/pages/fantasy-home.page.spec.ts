import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FantasyHomePage } from './fantasy-home.page';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiBaseUrl}/fantasy`;

describe('FantasyHomePage', () => {
  let component: FantasyHomePage;
  let fixture: ComponentFixture<FantasyHomePage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FantasyHomePage, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FantasyHomePage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${API}/leagues`).flush([]);
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / loadLeagues ───────────────────────────────────────────────

  describe('loadLeagues', () => {
    const mockLeagues = [
      { id: 1, name: 'Test League', inviteCode: 'ABCD1234', maxMembers: 20, status: 'draft', season: '2024-25', teams: [] },
    ];

    it('calls GET /fantasy/leagues on init', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(`${API}/leagues`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLeagues);
    });

    it('populates leagues signal after successful response', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush(mockLeagues);
      expect(component.leagues()).toEqual(mockLeagues);
    });

    it('sets loading to false after response', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush([]);
      expect(component.loading()).toBe(false);
    });

    it('sets loading to false on error', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).error(new ErrorEvent('Network error'));
      expect(component.loading()).toBe(false);
    });
  });

  // ── createLeague ────────────────────────────────────────────────────────

  describe('createLeague', () => {
    it('posts to /fantasy/leagues with name and maxMembers', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush([]); // initial load

      component.newLeagueName = 'Premier Predictors';
      component.newLeagueMaxMembers = 10;
      component.createLeague();

      const req = httpMock.expectOne(`${API}/leagues`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Premier Predictors', maxMembers: 10 });
      req.flush({ id: 2, name: 'Premier Predictors' });

      // After create, reload leagues
      httpMock.expectOne(`${API}/leagues`).flush([]);
    });

    it('closes modal and resets form after successful create', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush([]);

      component.showCreateModal = true;
      component.newLeagueName = 'Test';
      component.createLeague();

      httpMock.expectOne((req) => req.method === 'POST').flush({ id: 1 });
      httpMock.expectOne(`${API}/leagues`).flush([]);

      expect(component.showCreateModal).toBe(false);
      expect(component.newLeagueName).toBe('');
    });
  });

  // ── joinLeague ───────────────────────────────────────────────────────────

  describe('joinLeague', () => {
    it('posts to /fantasy/leagues/join with inviteCode', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush([]);

      component.joinCode = 'ABCD1234';
      component.joinLeague();

      const req = httpMock.expectOne(`${API}/leagues/join`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ inviteCode: 'ABCD1234' });
      req.flush({ success: true });

      httpMock.expectOne(`${API}/leagues`).flush([]);
    });

    it('sets joinError signal on HTTP error', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${API}/leagues`).flush([]);

      component.joinCode = 'BADCODE';
      component.joinLeague();

      httpMock.expectOne(`${API}/leagues/join`).flush(
        { message: 'League not found' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(component.joinError()).toBe('League not found');
    });
  });

  // ── initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with showCreateModal = false', () => {
      expect(component.showCreateModal).toBe(false);
    });

    it('starts with showJoinModal = false', () => {
      expect(component.showJoinModal).toBe(false);
    });

    it('starts with empty leagues signal', () => {
      expect(component.leagues()).toEqual([]);
    });
  });
});
