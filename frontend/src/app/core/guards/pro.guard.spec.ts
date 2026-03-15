import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { proGuard } from './pro.guard';
import { UserService } from '../services/user.service';

describe('proGuard', () => {
  const proRedirect = { redirectedTo: '/pro' } as any;

  const setup = () => {
    const userServiceMock = {
      currentUser: jasmine.createSpy('currentUser'),
      isPro: jasmine.createSpy('isPro'),
      getProfile: jasmine.createSpy('getProfile'),
    };

    const routerMock = {
      createUrlTree: jasmine
        .createSpy('createUrlTree')
        .and.returnValue(proRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const route: any = {
      data: { proFeature: 'advanced-analytics' },
    };
    const state: any = { url: '/analytics/match/10' };

    const executeGuard = () =>
      TestBed.runInInjectionContext(() => proGuard(route, state));

    return { userServiceMock, routerMock, executeGuard, state };
  };

  it('allows navigation when current user is already pro', () => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue({ id: 1, isPro: true });
    userServiceMock.isPro.and.returnValue(true);

    expect(executeGuard()).toBe(true);
  });

  it('redirects to pro page when current user is not pro', () => {
    const { userServiceMock, routerMock, executeGuard, state } = setup();
    userServiceMock.currentUser.and.returnValue({ id: 1, isPro: false });
    userServiceMock.isPro.and.returnValue(false);

    expect(executeGuard()).toEqual(proRedirect);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/pro'], {
      queryParams: {
        returnUrl: state.url,
        feature: 'advanced-analytics',
      },
    });
  });

  it('allows navigation when profile fetch returns pro user', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of({ isPro: true }));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('redirects when fetched profile is not pro', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of({ isPro: false }));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(proRedirect);
      done();
    });
  });

  it('redirects when fetched profile is null', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of(null));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(proRedirect);
      done();
    });
  });

  it('uses state url as feature fallback when route proFeature is absent', () => {
    const userServiceMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 1, isPro: false }),
      isPro: jasmine.createSpy('isPro').and.returnValue(false),
      getProfile: jasmine.createSpy('getProfile'),
    };
    const routerMock = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(proRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const route: any = { data: {} };
    const state: any = { url: '/pro-only/page' };

    const result = TestBed.runInInjectionContext(() => proGuard(route, state));

    expect(result).toEqual(proRedirect);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/pro'], {
      queryParams: {
        returnUrl: '/pro-only/page',
        feature: '/pro-only/page',
      },
    });
  });

  it('redirects when profile fetch errors', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(
      throwError(() => new Error('network error')),
    );

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(proRedirect);
      done();
    });
  });
});
