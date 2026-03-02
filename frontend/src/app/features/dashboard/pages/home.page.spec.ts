import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const mockAuthService = {
  getToken: () => 'fake-token',
  getCurrentUserId: () => 1,
};

describe('HomePage (Personalized Dashboard)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomePage,
        HttpClientTestingModule,
        RouterTestingModule,
        IonicModule.forRoot(),
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { defaultLang: 'en' } }),
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard`);
    req.flush(null);
    expect(component).toBeTruthy();
  });

  describe('when user is logged in', () => {
    const mockDashboard = {
      favoriteTeams: [{ id: 1, name: 'Arsenal', logoUrl: '' }] as any,
      recentResults: [
        { 
          id: 10, 
          homeTeam: { id: 1, name: 'Arsenal' } as any, 
          awayTeam: { id: 2, name: 'Chelsea' } as any, 
          homeScore: 2, 
          awayScore: 1 
        } as any,
      ],
      upcomingMatches: [],
      allRecentMatches: [],
      hasFavorites: true,
    };

    it('calls GET /dashboard and populates data on success', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDashboard);

      expect(component.dashboard).toEqual(mockDashboard as any);
      expect(component.loading).toBe(false);
    });

    it('sets loading to false on error', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard`);
      req.error(new ErrorEvent('Network error'));

      expect(component.dashboard).toBeNull();
      expect(component.loading).toBe(false);
    });
  });

  describe('getMatchScore', () => {
    it('returns formatted score string for a match with scores', () => {
      const match = { homeScore: 3, awayScore: 0 } as any;
      expect(component.getMatchScore(match)).toBe('3 - 0');
    });

    it('returns "vs" when scores are null', () => {
      expect(component.getMatchScore({ homeScore: null, awayScore: null } as any)).toBe('vs');
    });

    it('returns "vs" when homeScore is undefined', () => {
      expect(component.getMatchScore({} as any)).toBe('vs');
    });
  });

  describe('getTeamInitials', () => {
    it('returns two-letter initials for a team name', () => {
      expect(component.getTeamInitials('Arsenal')).toBe('AR');
    });

    it('returns initials from first letters of multiple words', () => {
      expect(component.getTeamInitials('Manchester City')).toBe('MC');
    });

    it('handles a single one-letter name', () => {
      expect(component.getTeamInitials('X')).toBe('X');
    });

    it('returns empty string for empty name', () => {
      expect(component.getTeamInitials('')).toBe('');
    });
  });
});

