import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { routes } from '../../app.routes';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

describe('Route Guard Redirects (integration-style)', () => {
  const setup = () => {
    const storeMock = {
      select: jasmine.createSpy('select').and.returnValue(of(false)),
    };
    const authMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      tryRestoreSession: jasmine.createSpy('tryRestoreSession').and.returnValue(of(false)),
    };
    const userServiceMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ role: 'USER', isPro: false })),
      isPro: jasmine.createSpy('isPro').and.returnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        Router,
        { provide: Store, useValue: storeMock },
        { provide: AuthService, useValue: authMock },
        { provide: UserService, useValue: userServiceMock },
      ],
    });

    const router = TestBed.inject(Router);
    return { router, storeMock, authMock, userServiceMock };
  };

  it('auth guard redirects to login with returnUrl', (done) => {
    const { router } = setup();
    const homeRoute = routes.find((r) => r.path === 'home') as any;
    const authGuardFn = homeRoute.canActivate[0];

    TestBed.runInInjectionContext(() =>
      authGuardFn(homeRoute, { url: '/home' } as any).subscribe((result: any) => {
        expect(router.serializeUrl(result)).toContain('/login');
        expect(router.serializeUrl(result)).toContain('returnUrl=%2Fhome');
        done();
      }),
    );
  });

  it('pro guard redirects analytics route to pro page with query params', (done) => {
    const { router } = setup();
    const analyticsRoute = routes.find((r) => r.path === 'analytics/team/:teamId') as any;
    const proGuardFn = analyticsRoute.canActivate[1];

    TestBed.runInInjectionContext(() =>
      proGuardFn(analyticsRoute, { url: '/analytics/team/10' } as any).subscribe((result: any) => {
        const serialized = router.serializeUrl(result);
        expect(serialized).toContain('/pro');
        expect(serialized).toContain('returnUrl=%2Fanalytics%2Fteam%2F10');
        done();
      }),
    );
  });

  it('admin guard redirects non-admin user to home', (done) => {
    const { router } = setup();
    const adminRoute = routes.find((r) => r.path === 'admin') as any;
    const adminGuardFn = adminRoute.canActivate[1];

    TestBed.runInInjectionContext(() =>
      adminGuardFn(adminRoute, { url: '/admin' } as any).subscribe((result: any) => {
        expect(router.serializeUrl(result)).toBe('/home');
        done();
      }),
    );
  });
});
