import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MatchDetailsPage } from './match-details.page';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { ApiService } from '../../../core/services/api.service';
import { LiveMatchService } from '../../../core/services/live-match.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('MatchDetailsPage', () => {
  const setup = () => {
    const updates$ = new Subject<any>();
    const liveState$ = new Subject<any>();
    const mockWebSocketService = jasmine.createSpyObj('WebSocketService', [
      'connectionStatus',
      'onMatchUpdate',
    ]);
    const mockApiService = jasmine.createSpyObj('ApiService', ['getMatch']);
    const mockLiveMatchService = jasmine.createSpyObj('LiveMatchService', [
      'initializeMatchState',
      'subscribeToMatch',
      'unsubscribeFromMatch',
    ]);
    const mockLogger = jasmine.createSpyObj('LoggerService', ['error']);

    mockWebSocketService.connectionStatus.and.returnValue(of('connected'));
    mockWebSocketService.onMatchUpdate.and.returnValue(updates$.asObservable());
    mockApiService.getMatch.and.returnValue(
      of({
        homeTeam: { name: 'Home FC', logo: 'home-logo.png' },
        awayTeam: { name: 'Away FC', logo: 'away-logo.png' },
        homeScore: 1,
        awayScore: 0,
        status: 'SCHEDULED',
      }),
    );
    mockLiveMatchService.subscribeToMatch.and.returnValue(liveState$.asObservable());

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: jasmine.createSpy().and.returnValue('123') } },
          },
        },
        { provide: WebSocketService, useValue: mockWebSocketService },
        { provide: ApiService, useValue: mockApiService },
        { provide: LiveMatchService, useValue: mockLiveMatchService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new MatchDetailsPage());
    const httpMock = TestBed.inject(HttpTestingController);

    return {
      page,
      updates$,
      liveState$,
      httpMock,
      mockWebSocketService,
      mockApiService,
      mockLiveMatchService,
      mockLogger,
    };
  };

  afterEach(() => {
    const controller = TestBed.inject(HttpTestingController, null, { optional: true });
    controller?.verify();
  });

  it('should create', () => {
    const { page } = setup();
    expect(page).toBeTruthy();
  });

  it('initializes from the route, loads the match, and wires live services', () => {
    const { page, mockApiService, mockLiveMatchService } = setup();
    let latest: any;
    page.match$.subscribe((value) => {
      latest = value;
    });

    page.ngOnInit();

    expect(page.matchId).toBe(123);
    expect(mockApiService.getMatch).toHaveBeenCalledWith(123);
    expect(mockLiveMatchService.initializeMatchState).toHaveBeenCalledWith(
      123,
      jasmine.objectContaining({
        homeScore: 1,
        awayScore: 0,
        status: 'SCHEDULED',
      }),
    );
    expect(mockLiveMatchService.subscribeToMatch).toHaveBeenCalledWith(123);
    expect(latest.homeName).toBe('Home FC');
  });

  it('applies raw websocket updates to the displayed match', () => {
    const { page, updates$ } = setup();
    let latest: any;
    page.match$.subscribe((value) => {
      latest = value;
    });

    page.ngOnInit();
    updates$.next({
      home: { name: 'Updated Home', logo: 'new-home.png' },
      away: { name: 'Updated Away', logo: 'new-away.png' },
      score: { home: 3, away: 2 },
      status: 'IN_PLAY',
    });

    expect(latest.homeName).toBe('Updated Home');
    expect(latest.awayName).toBe('Updated Away');
    expect(page.homeLogoLoaded).toBe(false);
    expect(page.awayLogoLoaded).toBe(false);
  });

  it('triggers score animation when live score changes', fakeAsync(() => {
    const { page, liveState$ } = setup();
    let latest: any;
    page.match$.subscribe((value) => {
      latest = value;
    });

    page.ngOnInit();
    liveState$.next({
      matchId: '123',
      homeScore: 2,
      awayScore: 0,
      status: 'IN_PLAY',
      minute: 65,
      isLive: true,
      lastUpdate: new Date(),
    });

    expect(page.scoreUpdated).toBe(true);
    expect(latest.homeScore).toBe(2);
    expect(latest.minute).toBe(65);

    tick(600);
    expect(page.scoreUpdated).toBe(false);
  }));

  it('loads real lineups when the segment switches and enough data is returned', () => {
    const { page, httpMock } = setup();

    page.ngOnInit();
    page.onTabChange({ detail: { value: 'lineups' } } as any);

    const req = httpMock.expectOne('/api/matches/123/lineups');
    expect(req.request.method).toBe('GET');
    req.flush([
      { team: { id: 1, name: 'Home' }, formation: '4-3-3', startXI: [], substitutes: [] },
      { team: { id: 2, name: 'Away' }, formation: '4-4-2', startXI: [], substitutes: [] },
    ]);

    expect(page.selectedTab).toBe('lineups');
    expect(page.lineups.length).toBe(2);
    expect(page.lineupsLoading).toBe(false);
  });

  it('falls back to demo lineups when the lineup request fails', () => {
    const { page, httpMock, mockLogger } = setup();

    page.ngOnInit();
    page.onTabChange({ detail: { value: 'lineups' } } as any);

    const req = httpMock.expectOne('/api/matches/123/lineups');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(mockLogger.error).toHaveBeenCalled();
    expect(page.lineups.length).toBe(2);
    expect(page.lineups[0].team.name).toBe('Home FC');
    expect(page.lineupsLoading).toBe(false);
  });

  it('updates logo flags when images finish loading', () => {
    const { page } = setup();

    page.onLogoLoaded('home');
    page.onLogoLoaded('away');

    expect(page.homeLogoLoaded).toBe(true);
    expect(page.awayLogoLoaded).toBe(true);
  });

  it('unsubscribes from live match updates on destroy', () => {
    const { page, mockLiveMatchService } = setup();

    page.ngOnInit();
    page.ngOnDestroy();

    expect(mockLiveMatchService.unsubscribeFromMatch).toHaveBeenCalledWith(123);
  });
});
