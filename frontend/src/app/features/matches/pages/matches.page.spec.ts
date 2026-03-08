import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
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
});
