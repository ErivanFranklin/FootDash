import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';

import { AuthService } from './auth.service';

describe('Auth', () => {
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normalizes email on login requests', () => {
    service.login('  ErivanF10@GMAIL.COM ', 'Password123!').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('erivanf10@gmail.com');
    expect(req.request.body.password).toBe('Password123!');
    req.flush({ tokens: { accessToken: jwtLikeToken } });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUserId()).toBe(1);
    expect(service.getCurrentUserRole()).toBe('USER');
    expect(storeMock.dispatch).toHaveBeenCalled();
  });

  it('normalizes email on register requests', () => {
    service.register('  User@Example.COM ', 'Secret123!').subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('user@example.com');
    expect(req.request.body.password).toBe('Secret123!');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
  });

  it('includes two-factor and recovery codes when provided', () => {
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
    expect(req.request.method).toBe('POST');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
    expect(service.getToken()).toBe(jwtLikeToken);
  });

  it('refreshAccessToken propagates error and keeps session', () => {
    service.refreshAccessToken().subscribe({
      next: () => fail('expected error'),
      error: (err) => expect(err.status).toBe(401),
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('tryRestoreSession returns false on refresh error', () => {
    service.tryRestoreSession().subscribe((ok) => {
      expect(ok).toBeFalse();
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('tryRestoreSession caches successful result briefly', () => {
    service.tryRestoreSession().subscribe((ok) => {
      expect(ok).toBeTrue();
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush({ tokens: { accessToken: jwtLikeToken } });

    service.tryRestoreSession().subscribe((ok) => {
      expect(ok).toBeTrue();
    });
  });

  it('logout and invalidateSession clear local auth state', () => {
    service.setToken(jwtLikeToken);
    expect(service.isAuthenticated()).toBeTrue();

    service.invalidateSession();
    expect(service.isAuthenticated()).toBeFalse();

    service.setToken(jwtLikeToken);
    service.logout();
    const req = httpMock.expectOne('/api/auth/revoke');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(service.getToken()).toBeNull();
  });

  it('returns null role for unsupported token role payload', () => {
    const badRoleToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOjIsInJvbGUiOiJPV05FUiJ9.' +
      'sig';

    service.setToken(badRoleToken);

    expect(service.getCurrentUserRole()).toBeNull();
  });
});
