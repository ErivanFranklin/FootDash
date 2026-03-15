import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { adminGuard } from './admin.guard';
import { UserService } from '../services/user.service';

describe('adminGuard', () => {
  const homeRedirect = { redirectedTo: '/home' } as any;

  const setup = () => {
    const userServiceMock = {
      currentUser: jasmine.createSpy('currentUser'),
      getProfile: jasmine.createSpy('getProfile'),
    };
    const routerMock = {
      createUrlTree: jasmine
        .createSpy('createUrlTree')
        .and.returnValue(homeRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const executeGuard = () =>
      TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    return { userServiceMock, routerMock, executeGuard };
  };

  it('allows navigation when current user is admin', () => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue({ role: 'ADMIN' });

    expect(executeGuard()).toBe(true);
  });

  it('redirects when current user is not admin', () => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue({ role: 'USER' });

    expect(executeGuard()).toEqual(homeRedirect);
    expect(userServiceMock.getProfile).not.toHaveBeenCalled();
  });

  it('allows when profile fetch returns admin user', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of({ role: 'ADMIN' }));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('redirects when profile fetch returns non-admin user', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of({ role: 'USER' }));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(homeRedirect);
      done();
    });
  });

  it('redirects when profile fetch returns null', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(of(null));

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(homeRedirect);
      done();
    });
  });

  it('redirects when profile fetch errors', (done) => {
    const { userServiceMock, executeGuard } = setup();
    userServiceMock.currentUser.and.returnValue(null);
    userServiceMock.getProfile.and.returnValue(
      throwError(() => new Error('profile error')),
    );

    (executeGuard() as any).subscribe((result: unknown) => {
      expect(result).toEqual(homeRedirect);
      done();
    });
  });
});
