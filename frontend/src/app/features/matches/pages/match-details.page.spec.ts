import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MatchDetailsPage } from './match-details.page';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { ApiService } from '../../../core/services/api.service';

describe('MatchDetailsPage', () => {
  let component: MatchDetailsPage;
  let fixture: ComponentFixture<MatchDetailsPage>;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const wsSpy = jasmine.createSpyObj('WebSocketService', [
      'subscribeToMatch',
      'unsubscribefromMatch',
      'connectionStatus',
      'onMatchUpdate'
    ]);
    const apiSpy = jasmine.createSpyObj('ApiService', ['getMatch']);
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { paramMap: { get: jasmine.createSpy().and.returnValue('123') } }
    });

    await TestBed.configureTestingModule({
      imports: [MatchDetailsPage],
      providers: [
        { provide: WebSocketService, useValue: wsSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchDetailsPage);
    component = fixture.componentInstance;
    mockWebSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should extract matchId from route params', () => {
      mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
      mockWebSocketService.onMatchUpdate.and.returnValue(of({}));
      mockApiService.getMatch.and.returnValue(of({}));

      component.ngOnInit();

      expect(component.matchId).toBe(123);
    });

    it('should subscribe to WebSocket connection status', () => {
      const status$ = of('connected');
      mockWebSocketService.connectionStatus.and.returnValue(status$);
      mockWebSocketService.onMatchUpdate.and.returnValue(of({}));
      mockApiService.getMatch.and.returnValue(of({}));

      component.ngOnInit();

      expect(component.connectionStatus$).toBe(status$);
    });

    it('should fetch initial match data and normalize it', () => {
      const rawMatch = {
        homeTeam: { name: 'Home FC', logo: 'home-logo.png' },
        awayTeam: { name: 'Away FC', logo: 'away-logo.png' },
        homeScore: 2,
        awayScore: 1,
        status: 'FT'
      };
      mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
      mockWebSocketService.onMatchUpdate.and.returnValue(of({}));
      mockApiService.getMatch.and.returnValue(of(rawMatch));

      component.ngOnInit();

      expect(mockApiService.getMatch).toHaveBeenCalledWith(123);
      expect(component.homeLogoLoaded).toBe(false); // has logo, so not loaded yet
      expect(component.awayLogoLoaded).toBe(false);
    });

    it('should subscribe to WebSocket match updates and normalize them', () => {
      const update = {
        home: { name: 'Updated Home', logo: 'updated-home.png' },
        away: { name: 'Updated Away' },
        score: { home: 3, away: 2 }
      };
      mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
      mockWebSocketService.onMatchUpdate.and.returnValue(of(update));
      mockApiService.getMatch.and.returnValue(of({}));

      component.ngOnInit();

      expect(mockWebSocketService.subscribeToMatch).toHaveBeenCalledWith(123);
    });
  });

  describe('Logo Loading', () => {
    it('should set logo loaded flags correctly for matches without logos', () => {
      const rawMatch = {
        homeTeam: { name: 'Home FC' }, // no logo
        awayTeam: { name: 'Away FC' }  // no logo
      };
      mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
      mockWebSocketService.onMatchUpdate.and.returnValue(of({}));
      mockApiService.getMatch.and.returnValue(of(rawMatch));

      component.ngOnInit();

      expect(component.homeLogoLoaded).toBe(true); // no logo, so "loaded"
      expect(component.awayLogoLoaded).toBe(true);
    });

    it('should update logo loaded flag when onLogoLoaded is called', () => {
      component.onLogoLoaded('home');
      expect(component.homeLogoLoaded).toBe(true);

      component.onLogoLoaded('away');
      expect(component.awayLogoLoaded).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from WebSocket on destroy', () => {
      mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
      mockWebSocketService.onMatchUpdate.and.returnValue(of({}));
      mockApiService.getMatch.and.returnValue(of({}));

      component.ngOnInit();
      component.ngOnDestroy();

      expect(mockWebSocketService.unsubscribefromMatch).toHaveBeenCalledWith(123);
    });
  });
});
