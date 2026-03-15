import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { MatchDiscussionPage } from './match-discussion.page';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ReactionsService } from '../../../services/social/reactions.service';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('MatchDiscussionPage', () => {
  const setup = () => {
    const params$ = new Subject<any>();
    const wsUpdates$ = new Subject<any>();

    const apiMock = {
      getMatch: jasmine.createSpy('getMatch').and.returnValue(
        of({
          teams: { home: { name: 'Arsenal' }, away: { name: 'Chelsea' } },
          fixture: { date: '2026-03-15', status: { short: 'live' } },
          goals: { home: 1, away: 0 },
        }),
      ),
    };
    const reactionsMock = {
      getReactionSummary: jasmine
        .createSpy('getReactionSummary')
        .and.returnValue(of({ totalCount: 1 })),
    };
    const websocketMock = {
      subscribeToMatch: jasmine.createSpy('subscribeToMatch'),
      onMatchUpdate: jasmine.createSpy('onMatchUpdate').and.returnValue(wsUpdates$.asObservable()),
    };
    const loggerMock = {
      error: jasmine.createSpy('error'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { params: params$.asObservable() } },
        { provide: ApiService, useValue: apiMock },
        { provide: ReactionsService, useValue: reactionsMock },
        { provide: WebSocketService, useValue: websocketMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new MatchDiscussionPage());
    return { page, params$, wsUpdates$, apiMock, reactionsMock, websocketMock, loggerMock };
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads match, reaction summary, and subscribes websocket on route param', () => {
    const { page, params$, websocketMock, reactionsMock } = setup();

    page.ngOnInit();
    params$.next({ id: '12' });

    expect(websocketMock.subscribeToMatch).toHaveBeenCalledWith(12);
    expect(reactionsMock.getReactionSummary).toHaveBeenCalled();
    expect(page.match?.homeTeam?.name).toBe('Arsenal');
    expect(page.loading).toBeFalse();
  });

  it('handles match load errors with fallback payload', () => {
    const { page, params$, apiMock, loggerMock } = setup();
    apiMock.getMatch.and.returnValue(throwError(() => new Error('boom')));

    page.ngOnInit();
    params$.next({ id: '5' });

    expect(loggerMock.error).toHaveBeenCalled();
    expect(page.match?.homeTeam?.name).toBe('Home Team');
    expect(page.loading).toBeFalse();
  });

  it('adds only matching match updates and classifies live event kind', () => {
    const { page, params$, wsUpdates$ } = setup();

    page.ngOnInit();
    params$.next({ id: '12' });
    wsUpdates$.next({ matchId: '99', message: 'other match' });
    wsUpdates$.next({ matchId: '12', message: 'Goal scored by home' });
    wsUpdates$.next({ matchId: '12', message: 'Kickoff in progress' });

    expect(page.liveEvents.length).toBe(2);
    expect(page.liveEvents[0].kind).toBe('kickoff');
    expect(page.liveEvents[1].kind).toBe('goal');
  });

  it('votePoll updates counts and percentages with storage persistence', () => {
    const { page } = setup();
    (page as any).matchId = 44;
    page.pollOptions = ['A', 'Draw', 'B'];
    page.pollVotes = { A: 0, Draw: 0, B: 0 };

    page.votePoll('A');
    page.votePoll('B');

    expect(page.selectedPollOption).toBe('B');
    expect(page.pollVotes['A']).toBe(0);
    expect(page.pollVotes['B']).toBe(1);
    expect(page.totalPollVotes()).toBe(1);
    expect(page.pollPercent('B')).toBe(100);
    expect(localStorage.getItem('match_poll_44')).toContain('"B":1');
  });

  it('status and score helpers cover default branches', () => {
    const { page } = setup();

    expect(page.getMatchStatusText()).toBe('');
    expect(page.getMatchScoreText()).toBe('');

    page.match = { status: 'finished', score: { home: 2, away: 1 } };
    expect(page.getMatchStatusText()).toBe('Finished');
    expect(page.getMatchScoreText()).toBe('2 - 1');

    page.match = { status: 'something-else' };
    expect(page.getMatchStatusText()).toBe('Unknown');
  });

  it('handles invalid poll storage json', () => {
    const { page } = setup();
    (page as any).matchId = 77;
    page.match = { homeTeam: { name: 'A' }, awayTeam: { name: 'B' } };
    localStorage.setItem('match_poll_77', 'not-json');

    (page as any).loadPollVotes();

    expect(page.pollVotes['A']).toBe(0);
    expect(page.pollVotes['B']).toBe(0);
    expect(page.pollVotes['Draw']).toBe(0);
  });
});
