import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const loginRedirect = { redirectedTo: '/login' } as any;

  const setup = (url = '/protected-route') => {
    const storeMock = {
      select: jasmine.createSpy('select'),
    };
    const authMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
      tryRestoreSession: jasmine.createSpy('tryRestoreSession'),
    };
    const routerMock = {
      createUrlTree: jasmine
        .createSpy('createUrlTree')
        .and.returnValue(loginRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const state = { url } as any;
    const executeGuard = () =>
      TestBed.runInInjectionContext(() => authGuard({} as any, state));

    return { storeMock, authMock, routerMock, executeGuard, state };
  };

  it('allows access when store says authenticated', (done) => {
    const { storeMock, authMock, executeGuard } = setup();
    storeMock.select.and.returnValue(of(true));
    authMock.isAuthenticated.and.returnValue(false);

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toBe(true);
      expect(authMock.tryRestoreSession).not.toHaveBeenCalled();
      done();
    });
  });

  it('allows access when service says authenticated even if store is false', (done) => {
    const { storeMock, authMock, executeGuard } = setup();
    storeMock.select.and.returnValue(of(false));
    authMock.isAuthenticated.and.returnValue(true);

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toBe(true);
      expect(authMock.tryRestoreSession).not.toHaveBeenCalled();
      done();
    });
  });

  it('allows access when session restoration succeeds', (done) => {
    const { storeMock, authMock, executeGuard } = setup();
    storeMock.select.and.returnValue(of(false));
    authMock.isAuthenticated.and.returnValue(false);
    authMock.tryRestoreSession.and.returnValue(of(true));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('redirects to login when session restoration returns false', (done) => {
    const { storeMock, authMock, routerMock, executeGuard, state } = setup();
    storeMock.select.and.returnValue(of(false));
    authMock.isAuthenticated.and.returnValue(false);
    authMock.tryRestoreSession.and.returnValue(of(false));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(loginRedirect);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      done();
    });
  });

  it('redirects to login when session restoration errors', (done) => {
    const { storeMock, authMock, executeGuard } = setup();
    storeMock.select.and.returnValue(of(false));
    authMock.isAuthenticated.and.returnValue(false);
    authMock.tryRestoreSession.and.returnValue(
      throwError(() => new Error('restore failed')),
    );

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(loginRedirect);
      done();
    });
  });

  it('passes through custom returnUrl when redirecting to login', (done) => {
    const { storeMock, authMock, routerMock, executeGuard } = setup('/custom-protected');
    storeMock.select.and.returnValue(of(false));
    authMock.isAuthenticated.and.returnValue(false);
    authMock.tryRestoreSession.and.returnValue(of(false));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(loginRedirect);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/custom-protected' },
      });
      done();
    });
  });
});
