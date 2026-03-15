import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Store, provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { selectToken } from '../../store/auth/auth.selectors';
import { authSetToken } from '../../store/auth/auth.actions';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let store: Store;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken', 'refreshAccessToken', 'isAuthenticated', 'invalidateSession'
    ]);
    
    const mockJwtHelper = { decodeToken: jasmine.createSpy().and.returnValue({ sub: '123' }) };
    (authServiceSpy as any).jwtHelper = mockJwtHelper;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideStore({}, {}),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    
    spyOn(store, 'select').and.returnValue(of(null));
    spyOn(store, 'dispatch').and.callThrough();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token is present', () => {
    authServiceSpy.getToken.and.returnValue('test-token');

    httpClient.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add Authorization header for auth endpoints', () => {
    authServiceSpy.getToken.and.returnValue('test-token');

    httpClient.get('/auth/login').subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
  });

  it('should refresh token on 401 error', () => {
    authServiceSpy.getToken.and.returnValue('expired-token');
    authServiceSpy.refreshAccessToken.and.returnValue(of('new-token'));

    httpClient.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Check if refresh was called
    expect(authServiceSpy.refreshAccessToken).toHaveBeenCalled();
    
    // Verify retry request
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ data: 'ok' });
  });

  it('should invalidate session if refresh fails and not authenticated', () => {
    authServiceSpy.getToken.and.returnValue('expired-token');
    authServiceSpy.refreshAccessToken.and.returnValue(of(null));
    authServiceSpy.isAuthenticated.and.returnValue(false);

    httpClient.get('/api/protected').subscribe({
      error: (err) => expect(err.status).toBe(401)
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.invalidateSession).toHaveBeenCalled();
  });
});
