import { TestBed } from '@angular/core/testing';
import { LiveMatchService } from './live-match.service';
import { WebSocketService } from './web-socket.service';
import { of } from 'rxjs';

describe('LiveMatchService', () => {
  let service: LiveMatchService;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;

  beforeEach(() => {
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', [
      'subscribeToMatch',
      'unsubscribefromMatch',
      'onMatchUpdate',
    ]);
    mockWebSocketService.onMatchUpdate.and.returnValue(of());

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

  it('should track live match IDs', () => {
    service.initializeMatchState(100, { status: 'IN_PLAY' });
    service.initializeMatchState(200, { status: 'FINISHED' });

    expect(service.isMatchLive(100)).toBe(true);
    expect(service.isMatchLive(200)).toBe(false);
    expect(service.getLiveMatchIds()).toContain('100');
    expect(service.getLiveMatchIds()).not.toContain('200');
  });
});
