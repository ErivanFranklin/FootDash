import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ToastController } from '@ionic/angular';
import { NotificationCenterService } from '../../../core/services/notification-center.service';

import { MatchesPage } from './matches.page';
import { ApiService } from '../../../core/services/api.service';

describe('MatchesPage', () => {
  let component: MatchesPage;
  let fixture: ComponentFixture<MatchesPage>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(waitForAsync(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getTeamMatches', 'syncTeamMatches']);
    apiSpy.getTeamMatches.and.returnValue(of([]));
    apiSpy.syncTeamMatches.and.returnValue(of({}));

    TestBed.configureTestingModule({
      imports: [
        MatchesPage,
        HttpClientTestingModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, pt: {}, es: {} },
          translocoConfig: { availableLangs: ['en', 'pt', 'es'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
        {
          provide: ToastController,
          useValue: {
            create: () => Promise.resolve({ present: () => undefined }),
          },
        },
        {
          provide: NotificationCenterService,
          useValue: {
            unreadCount$: of(0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchesPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply today quick filter with same from/to date and all range', () => {
    component.teamId = 1;
    spyOn(component, 'loadMatches').and.stub();

    const todayFilter = component.quickFilters.find((f) => f.value === 'today');
    expect(todayFilter).toBeTruthy();

    component.toggleQuickFilter(todayFilter);

    expect(component.range).toBe('all');
    expect(component.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.to).toBe(component.from);
    expect(component.loadMatches).toHaveBeenCalled();
  });

  it('should reset range/from/to to defaults when no quick filter is active', () => {
    component.teamId = 1;
    spyOn(component, 'loadMatches').and.stub();

    const upcomingFilter = component.quickFilters.find((f) => f.value === 'upcoming');
    expect(upcomingFilter).toBeTruthy();

    component.toggleQuickFilter(upcomingFilter);
    expect(component.range).toBe('upcoming');

    // Toggle off the same filter
    component.toggleQuickFilter(upcomingFilter);

    expect(component.range).toBe('recent');
    expect(component.from).toBeNull();
    expect(component.to).toBeNull();
    expect(component.loadMatches).toHaveBeenCalledTimes(2);
  });

  it('should seed demo fixtures in dev when API returns no data', () => {
    component.teamId = 1;
    component.loadMatches();

    expect(component.allFixtures.length).toBeGreaterThan(0);
    expect(component.fixtures.length).toBeGreaterThan(0);
  });

  it('handles loadMatches API error and resets loading flag', fakeAsync(() => {
    apiSpy.getTeamMatches.and.returnValue(throwError(() => new Error('failed')));
    component.teamId = 1;

    component.loadMatches();
    tick();

    expect(component.loading).toBeFalse();
  }));

  it('paginates fixtures via infinite scroll until no more data', () => {
    component.allFixtures = new Array(25).fill(null).map((_, i) => ({ id: i + 1 }));
    component.fixtures = component.allFixtures.slice(0, 10);
    component.hasMoreData = true;
    component.currentPage = 0;

    const event = { target: { complete: jasmine.createSpy('complete') } } as any;

    component.loadMoreMatches(event);
    expect(component.fixtures.length).toBe(20);
    expect(component.hasMoreData).toBeTrue();

    component.loadMoreMatches(event);
    expect(component.fixtures.length).toBe(25);
    expect(component.hasMoreData).toBeFalse();
    expect(event.target.complete).toHaveBeenCalledTimes(2);
  });

  it('completes infinite scroll immediately when no more data', () => {
    component.hasMoreData = false;
    const event = { target: { complete: jasmine.createSpy('complete') } } as any;

    component.loadMoreMatches(event);

    expect(event.target.complete).toHaveBeenCalled();
  });

  it('applies live quick filter and sets today range', () => {
    component.teamId = 1;
    spyOn(component, 'loadMatches').and.stub();

    const liveFilter = component.quickFilters.find((f) => f.value === 'live')!;
    component.toggleQuickFilter(liveFilter);

    expect(component.range).toBe('recent');
    expect(component.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.to).toBe(component.from);
    expect(component.loadMatches).toHaveBeenCalled();
  });

  it('syncFixtures success triggers refresh', fakeAsync(() => {
    component.teamId = 1;
    spyOn(component, 'loadMatches').and.stub();

    component.syncFixtures();
    tick();

    expect(apiSpy.syncTeamMatches).toHaveBeenCalled();
    expect(component.loadMatches).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  }));

  it('syncFixtures error keeps page stable', fakeAsync(() => {
    apiSpy.syncTeamMatches.and.returnValue(throwError(() => new Error('sync fail')));
    component.teamId = 1;

    component.syncFixtures();
    tick();

    expect(component.loading).toBeFalse();
  }));

  it('refresh handler completes refresher after timeout', fakeAsync(() => {
    spyOn(component, 'loadMatches').and.stub();
    const complete = jasmine.createSpy('complete');

    component.handleRefresh({ target: { complete } } as any);
    tick(1000);

    expect(component.loadMatches).toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
  }));
});
