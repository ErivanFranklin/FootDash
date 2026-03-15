import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads profile and stores current user signal', () => {
    let response: any;

    service.getProfile().subscribe((result) => (response = result));

    const req = httpMock.expectOne('/api/auth/profile');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, email: 'u@example.com', isPro: true });

    expect(response.email).toBe('u@example.com');
    expect(service.currentUser()?.email).toBe('u@example.com');
  });

  it('clears current user when profile request fails', () => {
    service.currentUser.set({ id: 2, email: 'old@example.com' } as any);

    service.getProfile().subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/auth/profile');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(service.currentUser()).toBeNull();
  });

  it('reports pro status from current user signal', () => {
    expect(service.isPro()).toBeFalse();

    service.currentUser.set({ id: 1, isPro: false } as any);
    expect(service.isPro()).toBeFalse();

    service.currentUser.set({ id: 1, isPro: true } as any);
    expect(service.isPro()).toBeTrue();
  });
});