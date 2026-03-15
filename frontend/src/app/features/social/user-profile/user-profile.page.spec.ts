import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { UserProfilePage } from './user-profile.page';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FollowService } from '../../../services/social/follow.service';
import { FeedService } from '../../../services/social/feed.service';
import { ReportsService } from '../../../services/social/reports.service';
import { GamificationService } from '../../../services/gamification.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { LoggerService } from '../../../core/services/logger.service';

describe('UserProfilePage', () => {
  const setup = () => {
    const params$ = new Subject<any>();
    const apiMock = {
      getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue(
        of({
          email: 'user@x.com',
          displayName: 'UserX',
          avatarUrl: null,
          createdAt: '2026-03-01',
          isPro: true,
        }),
      ),
      getTeam: jasmine.createSpy('getTeam').and.returnValue(
        of({ id: 7, name: 'Arsenal', logo: null }),
      ),
    };
    const followMock = {
      getFollowStats: jasmine
        .createSpy('getFollowStats')
        .and.returnValue(of({ followersCount: 2, followingCount: 3 })),
    };
    const feedMock = {
      getUserActivity: jasmine.createSpy('getUserActivity').and.returnValue(
        of({ activities: [], total: 0, page: 1, limit: 20, hasMore: false }),
      ),
    };
    const reportsMock = {
      createReport: jasmine.createSpy('createReport').and.returnValue(of({})),
    };
    const gamificationMock = {
      getUserBadges: jasmine.createSpy('getUserBadges').and.returnValue(of([])),
    };
    const favoritesMock = {
      loadFavorites: jasmine.createSpy('loadFavorites').and.returnValue(of([])),
    };
    const authMock = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(null),
    };
    const alertControllerMock = {
      create: jasmine.createSpy('create').and.callFake(async () => ({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      })),
    };
    const toastControllerMock = {
      create: jasmine.createSpy('create').and.callFake(async () => ({
        present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      })),
    };
    const loggerMock = {
      error: jasmine.createSpy('error'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { params: params$.asObservable() } },
        { provide: ApiService, useValue: apiMock },
        { provide: FollowService, useValue: followMock },
        { provide: FeedService, useValue: feedMock },
        { provide: ReportsService, useValue: reportsMock },
        { provide: GamificationService, useValue: gamificationMock },
        { provide: FavoritesService, useValue: favoritesMock },
        { provide: AuthService, useValue: authMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: ToastController, useValue: toastControllerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new UserProfilePage());
    return {
      page,
      params$,
      apiMock,
      followMock,
      feedMock,
      gamificationMock,
      favoritesMock,
      authMock,
      loggerMock,
      alertControllerMock,
    };
  };

  it('loads profile and dependent data on init', () => {
    const { page, params$, followMock, gamificationMock, feedMock } = setup();

    page.ngOnInit();
    params$.next({ id: '8' });

    expect(page.user?.username).toBe('UserX');
    expect(followMock.getFollowStats).toHaveBeenCalledWith(8);
    expect(gamificationMock.getUserBadges).toHaveBeenCalledWith(8);
    expect(feedMock.getUserActivity).toHaveBeenCalled();
  });

  it('sets profileUnavailable for 404 profile errors and skips follow-up loads', () => {
    const { page, params$, apiMock, followMock, gamificationMock, feedMock } = setup();
    apiMock.getUserProfile.and.returnValue(throwError(() => ({ status: 404 })));

    page.ngOnInit();
    params$.next({ id: '9' });

    expect(page.profileUnavailable).toBeTrue();
    expect(followMock.getFollowStats).not.toHaveBeenCalled();
    expect(gamificationMock.getUserBadges).not.toHaveBeenCalled();
    expect(feedMock.getUserActivity).not.toHaveBeenCalled();
  });

  it('loads fallback data for non-404 profile errors', () => {
    const { page, params$, apiMock, followMock, gamificationMock, feedMock, loggerMock } =
      setup();
    apiMock.getUserProfile.and.returnValue(throwError(() => ({ status: 500 })));

    page.ngOnInit();
    params$.next({ id: '10' });

    expect(page.profileUnavailable).toBeFalse();
    expect(page.user?.username).toBe('User 10');
    expect(followMock.getFollowStats).toHaveBeenCalled();
    expect(gamificationMock.getUserBadges).toHaveBeenCalled();
    expect(feedMock.getUserActivity).toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('appends activities on subsequent pages and tracks hasMore', () => {
    const { page, feedMock } = setup();
    feedMock.getUserActivity
      .and.returnValues(
        of({
          activities: [{ id: 1, activityType: 'comment', createdAt: new Date().toISOString() }],
          total: 1,
          page: 1,
          limit: 20,
          hasMore: true,
        }),
        of({
          activities: [{ id: 2, activityType: 'comment', createdAt: new Date().toISOString() }],
          total: 2,
          page: 2,
          limit: 20,
          hasMore: false,
        }),
      );
    page.userId = 99;

    (page as any).loadActivities();
    (page as any).loadActivities();

    expect(page.activities.length).toBe(2);
    expect(page.hasMore).toBeFalse();
  });

  it('loadMoreActivities respects loading/hasMore guard', () => {
    const { page } = setup();
    spyOn<any>(page, 'loadActivities');

    page.loading = true;
    page.hasMore = true;
    page.loadMoreActivities();
    expect((page as any).loadActivities).not.toHaveBeenCalled();

    page.loading = false;
    page.hasMore = false;
    page.loadMoreActivities();
    expect((page as any).loadActivities).not.toHaveBeenCalled();

    page.loading = false;
    page.hasMore = true;
    page.loadMoreActivities();
    expect((page as any).loadActivities).toHaveBeenCalledTimes(1);
  });

  it('loads favorite teams only for current user and handles empty favorites', () => {
    const { page, authMock, favoritesMock } = setup();
    page.userId = 55;
    authMock.getCurrentUserId.and.returnValue(55);
    favoritesMock.loadFavorites.and.returnValue(of([]));

    (page as any).loadFavoriteTeamsIfCurrentUser();

    expect(favoritesMock.loadFavorites).toHaveBeenCalledWith('team');
    expect(page.favoriteTeams).toEqual([]);
  });

  it('does not load favorite teams for other users', () => {
    const { page, authMock, favoritesMock } = setup();
    page.userId = 60;
    authMock.getCurrentUserId.and.returnValue(61);

    (page as any).loadFavoriteTeamsIfCurrentUser();

    expect(favoritesMock.loadFavorites).not.toHaveBeenCalled();
    expect(page.favoriteTeams).toEqual([]);
  });

  it('reportUser opens alert modal', async () => {
    const { page, alertControllerMock } = setup();

    await page.reportUser();

    expect(alertControllerMock.create).toHaveBeenCalled();
  });
});
