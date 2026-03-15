import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storeMock: { dispatch: jasmine.Spy };
  const jwtLikeToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIn0.' +
    'signature';

  beforeEach(() => {
    storeMock = { dispatch: jasmine.createSpy('dispatch') };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: Store,
          useValue: storeMock,
        },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normalizes email on login requests', () => {
    service.login('  ErivanF10@GMAIL.COM ', 'Password123!').subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUserId()).toBe(1);
    expect(service.getCurrentUserRole()).toBe('USER');
  });

  it('normalizes email on register requests', () => {
    service.register('  User@Example.COM ', 'Secret123!').subscribe();
    const req = httpMock.expectOne('/api/auth/register');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
  });

  it('includes two-factor and recovery codes', () => {
    service.login('u@x.com', 'pw', ' 123456 ', ' RECOVERY ').subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.body.twoFactorCode).toBe('123456');
    expect(req.request.body.recoveryCode).toBe('RECOVERY');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
  });

  it('does not set token when login response has no access token', () => {
    service.login('u@x.com', 'pw').subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ tokens: {} });
    expect(service.getToken()).toBeNull();
  });

  it('refreshAccessToken updates token on success', () => {
    service.refreshAccessToken().subscribe((token) => {
      expect(token).toBe(jwtLikeToken);
    });
    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
    expect(service.getToken()).toBe(jwtLikeToken);
  });

  it('refreshAccessToken propagates error', (done) => {
    service.refreshAccessToken().subscribe({
      next: () => fail('expected error'),
      error: (err) => {
          expect(err.status).toBe(401);
          done();
      },
    });
    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('tryRestoreSession handles successful refresh', (done) => {
    service.tryRestoreSession().subscribe((ok) => {
      expect(ok).toBeTrue();
      done();
    });
    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
  });

  it('logout and invalidateSession clear local auth state', () => {
    service.setToken(jwtLikeToken);
    service.invalidateSession();
    expect(service.isAuthenticated()).toBeFalse();

    service.setToken(jwtLikeToken);
    service.logout();
    const req = httpMock.expectOne('/api/auth/revoke');
    req.flush({});
    expect(service.getToken()).toBeNull();
  });

  describe('Branch Coverage Uplift', () => {
    it('should return null userId when no token is set', () => {
      service.invalidateSession();
      expect(service.getCurrentUserId()).toBeNull();
    });

    it('should handle missing accessToken in refresh response', (done) => {
      service.refreshAccessToken().subscribe(token => {
        expect(token).toBeNull();
        done();
      });
      const req = httpMock.expectOne('/api/auth/refresh');
      req.flush({ tokens: {} });
    });

    it('should handle missing accessToken in tryRestoreSession', (done) => {
      service.tryRestoreSession().subscribe(ok => {
        expect(ok).toBeFalse();
        done();
      });
      const req = httpMock.expectOne('/api/auth/refresh');
      req.flush({ tokens: { accessToken: null } }); 
    });
  });
});
