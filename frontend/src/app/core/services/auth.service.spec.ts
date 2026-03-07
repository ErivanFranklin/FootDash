import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';

import { AuthService } from './auth.service';

describe('Auth', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const jwtLikeToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJVU0VSIn0.' +
    'signature';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: Store,
          useValue: { dispatch: jasmine.createSpy('dispatch') },
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
  });

  it('normalizes email on register requests', () => {
    service.register('  User@Example.COM ', 'Secret123!').subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('user@example.com');
    expect(req.request.body.password).toBe('Secret123!');
    req.flush({ tokens: { accessToken: jwtLikeToken } });
  });
});
