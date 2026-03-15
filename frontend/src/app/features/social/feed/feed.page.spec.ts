import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FeedPage } from './feed.page';
import { FeedService } from '../../../services/social/feed.service';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ActivityTargetType, ActivityType, FeedType } from '../../../models/social';

describe('FeedPage', () => {
  const setup = () => {
    const feedServiceMock = {
      getGlobalFeed: jasmine.createSpy('getGlobalFeed').and.returnValue(
        of({
          activities: [
            {
              id: 1,
              userId: 10,
              userName: 'U',
              activityType: ActivityType.REACTION,
              targetType: ActivityTargetType.MATCH,
              targetId: 7,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          hasMore: true,
        }),
      ),
      getUserFeed: jasmine.createSpy('getUserFeed').and.returnValue(
        of({
          activities: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
        }),
      ),
    };

    const globalEvents$ = new Subject<any>();
    const websocketServiceMock = {
      onGlobalSocialEvent: jasmine
        .createSpy('onGlobalSocialEvent')
        .and.returnValue(globalEvents$.asObservable()),
    };

    const routerMock = {
      navigate: jasmine.createSpy('navigate'),
    };

    const loggerMock = {
      error: jasmine.createSpy('error'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: FeedService, useValue: feedServiceMock },
        { provide: WebSocketService, useValue: websocketServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new FeedPage());

    return {
      page,
      feedServiceMock,
      websocketServiceMock,
      routerMock,
      loggerMock,
      globalEvents$,
    };
  };

  it('loads global feed on init and subscribes to global events', () => {
    const { page, feedServiceMock, websocketServiceMock } = setup();

    page.ngOnInit();

    expect(feedServiceMock.getGlobalFeed).toHaveBeenCalled();
    expect(websocketServiceMock.onGlobalSocialEvent).toHaveBeenCalled();
    expect(page.activities.length).toBe(1);
  });

  it('logs error and clears loading when feed load fails', () => {
    const { page, feedServiceMock, loggerMock } = setup();
    feedServiceMock.getGlobalFeed.and.returnValue(
      throwError(() => new Error('feed failure')),
    );

    page.ngOnInit();

    expect(loggerMock.error).toHaveBeenCalled();
    expect(page.loading).toBeFalse();
  });

  it('adds activity on global event', () => {
    const { page, globalEvents$ } = setup();
    page.ngOnInit();
    globalEvents$.next({ type: 'follow', userId: 1, userName: 'A', targetId: 2 });
    expect(page.activities.length).toBe(2);
    expect(page.activities[0].userName).toBe('A');
  });

  it('changes type and resets', () => {
    const { page, feedServiceMock } = setup();
    page.ngOnInit();
    page.changeFeedType('user');
    expect(page.feedType).toBe('user');
    expect(feedServiceMock.getUserFeed).toHaveBeenCalled();
  });

  it('navigates', () => {
    const { page, routerMock } = setup();
    page.onActivityClicked({ targetType: ActivityTargetType.MATCH, targetId: 1 } as any);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/match', 1]);
    page.onUserClicked(5);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/user-profile', 5]);
  });

  it('completes refresher', () => {
    const { page } = setup();
    const event = { target: { complete: jasmine.createSpy() } };
    page.refreshFeed(event);
    expect(event.target.complete).toHaveBeenCalled();
  });

  it('adds follow activity from websocket when in global feed', () => {
    const { page, globalEvents$ } = setup();
    page.ngOnInit();

    globalEvents$.next({
      type: 'follow',
      userId: 21,
      userName: 'Follower',
      targetId: 99,
      data: { any: true },
    });

    expect(page.activities[0].activityType).toBe(ActivityType.FOLLOW);
    expect(page.activities[0].targetType).toBe(ActivityTargetType.USER);
  });

  it('does not add follow activity from websocket when in personalized feed', () => {
    const { page, globalEvents$ } = setup();
    page.feedType = FeedType.PERSONALIZED;
    page.ngOnInit();
    const initialLength = page.activities.length;

    globalEvents$.next({ type: 'follow', userId: 1, targetId: 2 });

    expect(page.activities.length).toBe(initialLength);
  });

  it('switches to personalized feed and resets pagination', () => {
    const { page, feedServiceMock } = setup();
    page.ngOnInit();

    page.changeFeedType('personalized');

    expect(page.feedType).toBe('personalized');
    expect(feedServiceMock.getUserFeed).toHaveBeenCalled();
    expect(page.currentPage).toBe(2);
  });

  it('loads more only when hasMore and not loading', () => {
    const { page, feedServiceMock } = setup();
    page.ngOnInit();
    const callsBefore = feedServiceMock.getGlobalFeed.calls.count();
    page.hasMore = true;
    page.loading = false;

    page.loadMoreActivities();

    expect(feedServiceMock.getGlobalFeed.calls.count()).toBeGreaterThan(callsBefore);
  });

  it('refreshes feed and completes refresher event', () => {
    const { page } = setup();
    page.ngOnInit();
    const complete = jasmine.createSpy('complete');

    page.refreshFeed({ target: { complete } });

    expect(complete).toHaveBeenCalled();
    expect(page.currentPage).toBeGreaterThan(1);
  });

  it('navigates based on activity target type', () => {
    const { page, routerMock } = setup();

    page.onActivityClicked({ targetType: ActivityTargetType.MATCH, targetId: 5 } as any);
    page.onActivityClicked({ targetType: ActivityTargetType.USER, targetId: 7 } as any);
    page.onActivityClicked({ targetType: ActivityTargetType.PREDICTION, targetId: 9 } as any);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/match', 5]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/user-profile', 7]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/match', 9]);
  });

  it('unsubscribes global event stream on destroy', () => {
    const { page } = setup();
    page.ngOnInit();
    const unsubSpy = spyOn<any>(page['globalEventSubscription'], 'unsubscribe');

    page.ngOnDestroy();

    expect(unsubSpy).toHaveBeenCalled();
  });
});
