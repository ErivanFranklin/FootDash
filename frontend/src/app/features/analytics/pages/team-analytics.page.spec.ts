import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TeamAnalyticsPage } from './team-analytics.page';
import { ApiService } from '../../../core/services/api.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('TeamAnalyticsPage', () => {
  const setup = (teamResponse: any = { id: 5, name: 'Arsenal', logo: 'logo.png' }) => {
    const routeMock = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('5'),
        },
      },
    };
    const apiMock = {
      getTeam: jasmine.createSpy('getTeam').and.returnValue(of(teamResponse)),
    };
    const routerMock = {
      navigate: jasmine.createSpy('navigate'),
    };
    const loggerMock = {
      error: jasmine.createSpy('error'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ApiService, useValue: apiMock },
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new TeamAnalyticsPage());
    return { page, apiMock, routerMock, loggerMock };
  };

  it('reads the team id from the route and loads the team', () => {
    const { page, apiMock } = setup();

    page.ngOnInit();

    expect(page.teamId).toBe(5);
    expect(apiMock.getTeam).toHaveBeenCalledWith(5);
  });

  it('maps array responses to the first team entry', () => {
    const { page } = setup([{ id: 5, name: 'Arsenal', logo: 'logo.png' }]);
    let latest: any;

    page.loadTeam();
    page.team$.subscribe((value) => {
      latest = value;
    });

    expect(page.loading).toBe(false);
    expect(latest).toEqual({ id: 5, name: 'Arsenal', logo: 'logo.png' });
  });

  it('falls back to the route team id when the payload has no usable team id', () => {
    const { page } = setup({ name: 'Unknown payload' });
    let latest: any;
    page.teamId = 77;

    page.loadTeam();
    page.team$.subscribe((value) => {
      latest = value;
    });

    expect(latest).toEqual({ id: 77, name: 'Team', logo: undefined });
  });

  it('logs and returns a fallback team when loading fails', () => {
    const { page, apiMock, loggerMock } = setup();
    apiMock.getTeam.and.returnValue(throwError(() => new Error('load failed')));
    let latest: any;
    page.teamId = 91;

    page.loadTeam();
    page.team$.subscribe((value) => {
      latest = value;
    });

    expect(loggerMock.error).toHaveBeenCalled();
    expect(page.loading).toBe(false);
    expect(latest).toEqual({ id: 91, name: 'Team', logo: undefined });
  });

  it('falls back to teams route when back navigation history is unavailable', () => {
    const { page, routerMock } = setup();
    spyOnProperty(window.history, 'length', 'get').and.returnValue(1);

    page.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/teams']);
  });

  it('switches the selected analytics view from the segment event', () => {
    const { page } = setup();

    page.onSegmentChange({ detail: { value: 'charts' } });

    expect(page.selectedView).toBe('charts');
  });
});