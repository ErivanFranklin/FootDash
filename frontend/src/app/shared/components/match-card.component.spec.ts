import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MatchCardComponent } from './match-card.component';
import { ShareService } from '../../core/services/share.service';

describe('MatchCardComponent', () => {
  let component: MatchCardComponent;
  let mockShareService: jasmine.SpyObj<ShareService>;

  beforeEach(() => {
    mockShareService = jasmine.createSpyObj('ShareService', ['shareMatch']);

    TestBed.configureTestingModule({
      imports: [
        MatchCardComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: ShareService, useValue: mockShareService },
      ],
    });

    const fixture = TestBed.createComponent(MatchCardComponent);
    component = fixture.componentInstance;
  });

  // --- getHomeTeamName ---

  describe('getHomeTeamName', () => {
    it('returns homeTeam.name when available', () => {
      component.match = { homeTeam: { name: 'Arsenal' } };
      expect(component.getHomeTeamName()).toBe('Arsenal');
    });

    it('falls back to home.name', () => {
      component.match = { home: { name: 'Chelsea' } };
      expect(component.getHomeTeamName()).toBe('Chelsea');
    });

    it('falls back to homeTeamName', () => {
      component.match = { homeTeamName: 'Liverpool' };
      expect(component.getHomeTeamName()).toBe('Liverpool');
    });

    it('returns "Unknown Team" when no home team data', () => {
      component.match = {};
      expect(component.getHomeTeamName()).toBe('Unknown Team');
    });

    it('returns "Unknown Team" when match is null', () => {
      component.match = null;
      expect(component.getHomeTeamName()).toBe('Unknown Team');
    });
  });

  // --- getAwayTeamName ---

  describe('getAwayTeamName', () => {
    it('returns awayTeam.name when available', () => {
      component.match = { awayTeam: { name: 'Man United' } };
      expect(component.getAwayTeamName()).toBe('Man United');
    });

    it('falls back to away.name', () => {
      component.match = { away: { name: 'Tottenham' } };
      expect(component.getAwayTeamName()).toBe('Tottenham');
    });

    it('falls back to awayTeamName', () => {
      component.match = { awayTeamName: 'Leicester' };
      expect(component.getAwayTeamName()).toBe('Leicester');
    });

    it('returns "Unknown Team" when no away team data', () => {
      component.match = {};
      expect(component.getAwayTeamName()).toBe('Unknown Team');
    });
  });

  // --- getMatchDate ---

  describe('getMatchDate', () => {
    it('returns date from kickOff', () => {
      const dateStr = '2025-02-25T15:00:00Z';
      component.match = { kickOff: dateStr };
      const result = component.getMatchDate();
      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBe(new Date(dateStr).getTime());
    });

    it('falls back to date field', () => {
      const dateStr = '2025-03-01T20:00:00Z';
      component.match = { date: dateStr };
      expect(component.getMatchDate()!.getTime()).toBe(new Date(dateStr).getTime());
    });

    it('falls back to fixtureDate', () => {
      const dateStr = '2025-04-10T18:00:00Z';
      component.match = { fixtureDate: dateStr };
      expect(component.getMatchDate()!.getTime()).toBe(new Date(dateStr).getTime());
    });

    it('returns null when no date data', () => {
      component.match = {};
      expect(component.getMatchDate()).toBeNull();
    });
  });

  // --- getLeagueName ---

  describe('getLeagueName', () => {
    it('returns league name when available', () => {
      component.match = { league: { name: 'Premier League' } };
      expect(component.getLeagueName()).toBe('Premier League');
    });

    it('returns null when no league', () => {
      component.match = {};
      expect(component.getLeagueName()).toBeNull();
    });
  });

  // --- getVenueName ---

  describe('getVenueName', () => {
    it('returns venue name when available', () => {
      component.match = { venue: { name: 'Emirates Stadium' } };
      expect(component.getVenueName()).toBe('Emirates Stadium');
    });

    it('returns null when no venue', () => {
      component.match = {};
      expect(component.getVenueName()).toBeNull();
    });
  });

  // --- hasScore / getHomeScore / getAwayScore ---

  describe('hasScore', () => {
    it('returns true when homeScore is present', () => {
      component.match = { homeScore: 2 };
      expect(component.hasScore()).toBe(true);
    });

    it('returns true when homeScore is 0', () => {
      component.match = { homeScore: 0 };
      expect(component.hasScore()).toBe(true);
    });

    it('returns true when awayScore is present', () => {
      component.match = { awayScore: 1 };
      expect(component.hasScore()).toBe(true);
    });

    it('returns false when no scores', () => {
      component.match = {};
      expect(component.hasScore()).toBe(false);
    });
  });

  describe('getHomeScore', () => {
    it('returns homeScore when available', () => {
      component.match = { homeScore: 3 };
      expect(component.getHomeScore()).toBe(3);
    });

    it('falls back to score.fullTime.home', () => {
      component.match = { score: { fullTime: { home: 1 } } };
      expect(component.getHomeScore()).toBe(1);
    });

    it('returns "-" when no score data', () => {
      component.match = {};
      expect(component.getHomeScore()).toBe('-');
    });
  });

  describe('getAwayScore', () => {
    it('returns awayScore when available', () => {
      component.match = { awayScore: 2 };
      expect(component.getAwayScore()).toBe(2);
    });

    it('falls back to score.fullTime.away', () => {
      component.match = { score: { fullTime: { away: 0 } } };
      expect(component.getAwayScore()).toBe(0);
    });

    it('returns "-" when no score data', () => {
      component.match = {};
      expect(component.getAwayScore()).toBe('-');
    });
  });

  // --- isHalfTime ---

  describe('isHalfTime', () => {
    it('returns true for HALFTIME status', () => {
      component.match = { status: 'HALFTIME' };
      expect(component.isHalfTime()).toBe(true);
    });

    it('returns true for HALF status', () => {
      component.match = { status: 'HALF' };
      expect(component.isHalfTime()).toBe(true);
    });

    it('returns false for IN_PLAY status', () => {
      component.match = { status: 'IN_PLAY' };
      expect(component.isHalfTime()).toBe(false);
    });

    it('returns false for FT status', () => {
      component.match = { status: 'FT' };
      expect(component.isHalfTime()).toBe(false);
    });

    it('handles missing status gracefully', () => {
      component.match = {};
      expect(component.isHalfTime()).toBe(false);
    });
  });

  // --- getHalfTimeScore ---

  describe('getHalfTimeScore', () => {
    it('returns formatted half-time score', () => {
      component.match = { score: { halfTime: { home: 1, away: 0 } } };
      expect(component.getHalfTimeScore()).toBe('1-0');
    });

    it('returns dashes when no half-time data', () => {
      component.match = {};
      expect(component.getHalfTimeScore()).toBe('---');
    });
  });

  // --- getMatchMinute ---

  describe('getMatchMinute', () => {
    it('returns minute when available', () => {
      component.match = { minute: 67 };
      expect(component.getMatchMinute()).toBe(67);
    });

    it('returns undefined when no minute', () => {
      component.match = {};
      expect(component.getMatchMinute()).toBeUndefined();
    });
  });

  // --- onShare ---

  describe('onShare', () => {
    it('calls shareService.shareMatch with match data', () => {
      const matchData = { id: 1, homeTeam: { name: 'Arsenal' } };
      component.match = matchData;
      component.onShare();
      expect(mockShareService.shareMatch).toHaveBeenCalledWith(matchData);
    });
  });
});
