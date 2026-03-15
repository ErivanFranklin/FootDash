import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  const setup = (tokenInStore: string | null = null) => {
    const storeMock = {
      select: jasmine.createSpy('select').and.returnValue(of(tokenInStore)),
      dispatch: jasmine.createSpy('dispatch'),
    };

    const authMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue(tokenInStore),
      refreshAccessToken: jasmine.createSpy('refreshAccessToken'),
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      invalidateSession: jasmine.createSpy('invalidateSession'),
      jwtHelper: {
        decodeToken: jasmine.createSpy('decodeToken').and.returnValue({ sub: 9 }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: storeMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    const run = (req: HttpRequest<unknown>, nextFn: any) =>
      TestBed.runInInjectionContext(() => authInterceptor(req, nextFn));

    return { storeMock, authMock, run };
  };

  it('always sets withCredentials', (done) => {
    const { run } = setup('token');
    const req = new HttpRequest('GET', '/teams');

    run(req, (finalReq: HttpRequest<unknown>) => {
      expect(finalReq.withCredentials).toBeTrue();
      return of(new HttpResponse({ status: 200 }));
    }).subscribe(() => done());
  });

  it('attaches Authorization header on non-auth endpoints', (done) => {
    const { run } = setup('abc-token');
    const req = new HttpRequest('GET', '/teams');

    run(req, (finalReq: HttpRequest<unknown>) => {
      expect(finalReq.headers.get('Authorization')).toBe('Bearer abc-token');
      return of(new HttpResponse({ status: 200 }));
    }).subscribe(() => done());
  });

  it('does not attach Authorization header on auth endpoints', (done) => {
    const { run } = setup('abc-token');
    const req = new HttpRequest('POST', '/auth/login', null);

    run(req, (finalReq: HttpRequest<unknown>) => {
      expect(finalReq.headers.has('Authorization')).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    }).subscribe(() => done());
  });

  it('refreshes token on 401 and retries request', (done) => {
    const { authMock, storeMock, run } = setup('old-token');
    const req = new HttpRequest('GET', '/matches');
    authMock.refreshAccessToken.and.returnValue(of('new-token'));

    let callCount = 0;
    run(req, (finalReq: HttpRequest<unknown>) => {
      callCount += 1;
      if (callCount === 1) {
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      }
      expect(finalReq.headers.get('Authorization')).toBe('Bearer new-token');
      return of(new HttpResponse({ status: 200 }));
    }).subscribe(() => {
      expect(authMock.refreshAccessToken).toHaveBeenCalled();
      expect(storeMock.dispatch).toHaveBeenCalled();
      done();
    });
  });

  it('invalidates session when refresh returns no token and auth is invalid', (done) => {
    const { authMock, run } = setup('old-token');
    const req = new HttpRequest('GET', '/matches');
    authMock.refreshAccessToken.and.returnValue(of(null));
    authMock.isAuthenticated.and.returnValue(false);

    run(req, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
      next: () => fail('expected error'),
      error: () => {
        expect(authMock.invalidateSession).toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not refresh on passive alert polling endpoints', (done) => {
    const { authMock, run } = setup('old-token');
    const req = new HttpRequest('GET', '/alerts/unread');

    run(req, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
      next: () => fail('expected error'),
      error: () => {
        expect(authMock.refreshAccessToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not attempt refresh when there is no session token', (done) => {
    const { authMock, run } = setup(null);
    const req = new HttpRequest('GET', '/matches');

    run(req, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
      next: () => fail('expected error'),
      error: () => {
        expect(authMock.refreshAccessToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not invalidate session when refresh fails but auth still valid', (done) => {
    const { authMock, run } = setup('old-token');
    const req = new HttpRequest('GET', '/matches');
    authMock.refreshAccessToken.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    authMock.isAuthenticated.and.returnValue(true);

    run(req, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
      next: () => fail('expected error'),
      error: () => {
        expect(authMock.refreshAccessToken).toHaveBeenCalled();
        expect(authMock.invalidateSession).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
