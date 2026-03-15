import { TestBed } from '@angular/core/testing';
import { LiveMatchService } from './live-match.service';
import { WebSocketService } from './web-socket.service';
import { of, Subject } from 'rxjs';

describe('LiveMatchService', () => {
  let service: LiveMatchService;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;
  let updates$: Subject<any>;

  beforeEach(() => {
    updates$ = new Subject<any>();
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', [
      'subscribeToMatch',
      'unsubscribeFromMatch',
      'onMatchUpdate',
    ]);
    mockWebSocketService.onMatchUpdate.and.returnValue(updates$.asObservable());

    TestBed.configureTestingModule({
      providers: [
        LiveMatchService,
        { provide: WebSocketService, useValue: mockWebSocketService },
      ],
    });
    service = TestBed.inject(LiveMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe to a match', (done) => {
    const matchId = 123;
    const subscription = service.subscribeToMatch(matchId);

    expect(mockWebSocketService.subscribeToMatch).toHaveBeenCalledWith(matchId);

    subscription.subscribe((state) => {
      expect(state).toBeDefined();
      expect(state.matchId).toBe(String(matchId));
      done();
    });
  });

  it('should unsubscribe from match via websocket service', () => {
    service.unsubscribeFromMatch(321);

    expect(mockWebSocketService.unsubscribeFromMatch).toHaveBeenCalledWith(321);
  });

  it('should detect live matches correctly', () => {
    expect(service['checkIfLive']('IN_PLAY')).toBe(true);
    expect(service['checkIfLive']('LIVE')).toBe(true);
    expect(service['checkIfLive']('HALFTIME')).toBe(true);
    expect(service['checkIfLive']('FINISHED')).toBe(false);
    expect(service['checkIfLive']('SCHEDULED')).toBe(false);
  });

  it('should initialize match state', () => {
    const matchId = 456;
    service.initializeMatchState(matchId, {
      homeScore: 2,
      awayScore: 1,
      status: 'IN_PLAY',
      minute: 45,
    });

    const state = service.getMatchState(matchId);
    expect(state).toBeDefined();
    expect(state?.homeScore).toBe(2);
    expect(state?.awayScore).toBe(1);
    expect(state?.status).toBe('IN_PLAY');
    expect(state?.isLive).toBe(true);
  });

  it('handles websocket updates and updates live set', () => {
    service.subscribeToMatch(500).subscribe();

    updates$.next({
      matchId: '500',
      score: { fullTime: { home: 1, away: 2 }, halfTime: { home: 1, away: 1 } },
      status: 'IN_PLAY',
      minute: 70,
      timestamp: new Date(),
    });

    const state = service.getMatchState(500);
    expect(state?.homeScore).toBe(1);
    expect(state?.awayScore).toBe(2);
    expect(service.isMatchLive(500)).toBe(true);

    updates$.next({
      matchId: '500',
      score: { fullTime: { home: 2, away: 2 }, halfTime: { home: 1, away: 1 } },
      status: 'FINISHED',
      timestamp: new Date(),
    });

    expect(service.isMatchLive(500)).toBe(false);
  });

  it('getMatchState returns null for unknown matches', () => {
    expect(service.getMatchState('unknown')).toBeNull();
  });

  it('ignores websocket calls when dependency is absent', () => {
    (service as any)._wsService = null;
    (service as any).resolved = true;

    expect(() => service.subscribeToMatch(11)).not.toThrow();
    expect(() => service.unsubscribeFromMatch(11)).not.toThrow();
  });

  it('ngOnDestroy unsubscribes tracked matches and clears state', () => {
    service.initializeMatchState(100, { status: 'IN_PLAY' });
    service.initializeMatchState(200, { status: 'FINISHED' });
    const spy = spyOn(service, 'unsubscribeFromMatch').and.callThrough();

    service.ngOnDestroy();

    expect(spy).toHaveBeenCalledWith('100');
    expect(spy).toHaveBeenCalledWith('200');
    expect(service.getLiveMatchIds()).toEqual([]);
  });

  it('should track live match IDs', () => {
    service.initializeMatchState(100, { status: 'IN_PLAY' });
    service.initializeMatchState(200, { status: 'FINISHED' });

    expect(service.isMatchLive(100)).toBe(true);
    expect(service.isMatchLive(200)).toBe(false);
    expect(service.getLiveMatchIds()).toContain('100');
    expect(service.getLiveMatchIds()).not.toContain('200');
  });
});
