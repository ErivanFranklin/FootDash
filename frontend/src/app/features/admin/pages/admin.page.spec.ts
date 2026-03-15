import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminPage } from './admin.page';
import { AdminService } from '../../../core/services/admin.service';
import { ToastController } from '@ionic/angular';

describe('AdminPage', () => {
  const createToastMock = () => ({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
  });

  const setup = () => {
    const adminServiceMock = {
      getStats: jasmine.createSpy('getStats').and.returnValue(
        of({
          totalUsers: 2,
          totalAdmins: 1,
          totalProUsers: 1,
          newUsersLast7Days: 1,
        }),
      ),
      listUsers: jasmine.createSpy('listUsers').and.returnValue(
        of({
          items: [
            {
              id: 1,
              email: 'a@mail.com',
              role: 'USER',
              isPro: false,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      ),
      updateUserRole: jasmine.createSpy('updateUserRole').and.returnValue(
        of({
          id: 1,
          email: 'a@mail.com',
          role: 'ADMIN',
          isPro: false,
          createdAt: new Date().toISOString(),
        }),
      ),
      updateUserPro: jasmine.createSpy('updateUserPro').and.returnValue(
        of({
          id: 1,
          email: 'a@mail.com',
          role: 'USER',
          isPro: true,
          createdAt: new Date().toISOString(),
        }),
      ),
    };

    const toastControllerMock = {
      create: jasmine.createSpy('create').and.callFake(async () => createToastMock()),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: ToastController, useValue: toastControllerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new AdminPage());

    return { page, adminServiceMock, toastControllerMock };
  };

  it('loads stats and users on init', () => {
    const { page, adminServiceMock } = setup();

    page.ngOnInit();

    expect(adminServiceMock.getStats).toHaveBeenCalled();
    expect(adminServiceMock.listUsers).toHaveBeenCalled();
    expect(page.users.length).toBe(1);
  });

  it('maps role color correctly', () => {
    const { page } = setup();

    expect(page.roleColor('ADMIN')).toBe('danger');
    expect(page.roleColor('MODERATOR')).toBe('warning');
    expect(page.roleColor('USER')).toBe('medium');
  });

  it('updates role filter and reapplies filters', () => {
    const { page } = setup();
    spyOn(page, 'applyFilters');

    page.setRoleFilter('ADMIN');

    expect(page.roleFilter).toBe('ADMIN');
    expect(page.applyFilters).toHaveBeenCalled();
  });

  it('updates pro filter and reapplies filters', () => {
    const { page } = setup();
    spyOn(page, 'applyFilters');

    page.setProFilter('true');

    expect(page.proFilter).toBe('true');
    expect(page.applyFilters).toHaveBeenCalled();
  });

  it('handles loadUsers error and shows toast', async () => {
    const { page, adminServiceMock, toastControllerMock } = setup();
    adminServiceMock.listUsers.and.returnValue(throwError(() => new Error('fail')));

    page.loadUsers();

    await Promise.resolve();
    await Promise.resolve();

    expect(page.loadingUsers).toBeFalse();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('loadMoreUsers completes immediately when already loading', () => {
    const { page } = setup();
    const complete = jasmine.createSpy('complete');
    spyOn(page, 'loadUsers');
    page.loadingUsers = true;

    page.loadMoreUsers({ target: { complete } });

    expect(complete).toHaveBeenCalled();
    expect(page.loadUsers).not.toHaveBeenCalled();
  });

  it('updates user role and refreshes data', () => {
    const { page, adminServiceMock } = setup();
    spyOn<any>(page, 'refreshStats');
    spyOn<any>(page, 'refreshCurrentWindow');
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    const user: any = { id: 1, role: 'USER', isPro: false };
    page.onRoleChange(user, 'ADMIN');

    expect(adminServiceMock.updateUserRole).toHaveBeenCalledWith(1, 'ADMIN');
  });

  it('does not call role update on no-op role change', () => {
    const { page, adminServiceMock } = setup();
    const user: any = { id: 1, role: 'USER', isPro: false };

    page.onRoleChange(user, 'USER');

    expect(adminServiceMock.updateUserRole).not.toHaveBeenCalled();
  });

  it('updates pro status and calls service', () => {
    const { page, adminServiceMock } = setup();
    spyOn<any>(page, 'refreshStats');
    spyOn<any>(page, 'refreshCurrentWindow');
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    const user: any = { id: 1, role: 'USER', isPro: false };
    page.onProChange(user, true);

    expect(adminServiceMock.updateUserPro).toHaveBeenCalledWith(1, true);
  });

  it('does not call pro update on no-op pro change', () => {
    const { page, adminServiceMock } = setup();
    const user: any = { id: 1, role: 'USER', isPro: true };

    page.onProChange(user, true);

    expect(adminServiceMock.updateUserPro).not.toHaveBeenCalled();
  });

  it('handles role update error branch', async () => {
    const { page, adminServiceMock } = setup();
    adminServiceMock.updateUserRole.and.returnValue(
      throwError(() => ({ error: { message: 'role update denied' } })),
    );
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    page.onRoleChange({ id: 1, role: 'USER', isPro: false } as any, 'ADMIN');
    await Promise.resolve();

    expect((page as any).showToast).toHaveBeenCalledWith('role update denied', 'danger');
  });

  it('handles pro update error branch', async () => {
    const { page, adminServiceMock } = setup();
    adminServiceMock.updateUserPro.and.returnValue(
      throwError(() => new Error('pro update failed')),
    );
    spyOn<any>(page, 'showToast').and.returnValue(Promise.resolve());

    page.onProChange({ id: 1, role: 'USER', isPro: false } as any, true);
    await Promise.resolve();

    expect((page as any).showToast).toHaveBeenCalledWith(
      'Failed to update Pro status',
      'danger',
    );
  });
});
