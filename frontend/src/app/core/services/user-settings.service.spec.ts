import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { UserSettingsService } from './user-settings.service';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UserSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets and updates profile including avatar operations', () => {
    service.getProfile(1).subscribe();
    const getReq = httpMock.expectOne('/api/users/1/profile');
    expect(getReq.request.method).toBe('GET');
    expect(getReq.request.withCredentials).toBeTrue();
    getReq.flush({});

    service.updateProfile(1, { displayName: 'A' }).subscribe();
    const putReq = httpMock.expectOne('/api/users/1/profile');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({ displayName: 'A' });
    putReq.flush({});

    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    service.uploadAvatar(1, file).subscribe();
    const uploadReq = httpMock.expectOne('/api/users/1/profile/avatar');
    expect(uploadReq.request.method).toBe('POST');
    expect(uploadReq.request.body instanceof FormData).toBeTrue();
    uploadReq.flush({});

    service.deleteAvatar(1).subscribe();
    const deleteReq = httpMock.expectOne('/api/users/1/profile/avatar');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
  });

  it('handles preferences and notification endpoints', () => {
    service.getPreferences(2).subscribe();
    const getReq = httpMock.expectOne('/api/users/2/preferences');
    expect(getReq.request.method).toBe('GET');
    getReq.flush({});

    service.updatePreferences(2, { language: 'pt' } as any).subscribe();
    const putReq = httpMock.expectOne('/api/users/2/preferences');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({});

    service.updateTheme(2, 'dark').subscribe();
    const themeReq = httpMock.expectOne('/api/users/2/preferences');
    expect(themeReq.request.method).toBe('PUT');
    expect(themeReq.request.body).toEqual({ theme: 'dark' });
    themeReq.flush({});

    service.updateNotificationPrefs(2, { pushNotifications: true }).subscribe();
    const notifReq = httpMock.expectOne('/api/users/2/preferences/notifications');
    expect(notifReq.request.method).toBe('PATCH');
    notifReq.flush({});
  });

  it('calls account-security endpoints', () => {
    service.changePassword({ currentPassword: 'a', newPassword: 'b' }).subscribe();
    httpMock.expectOne('/api/auth/change-password').flush({});

    service.getTwoFactorStatus().subscribe();
    httpMock.expectOne('/api/auth/2fa/status').flush({});

    service.setupTwoFactor().subscribe();
    const setupReq = httpMock.expectOne('/api/auth/2fa/setup');
    expect(setupReq.request.method).toBe('POST');
    setupReq.flush({});

    service.verifyTwoFactor('123456').subscribe();
    const verifyReq = httpMock.expectOne('/api/auth/2fa/verify');
    expect(verifyReq.request.body).toEqual({ code: '123456' });
    verifyReq.flush({ valid: true });

    service.enableTwoFactor('654321').subscribe();
    httpMock.expectOne('/api/auth/2fa/enable').flush({ recoveryCodes: [] });

    service.disableTwoFactor('654321').subscribe();
    httpMock.expectOne('/api/auth/2fa/disable').flush({ message: 'ok' });
  });

  it('gets and revokes auth sessions', () => {
    service.getSessions().subscribe();
    const sessionsReq = httpMock.expectOne('/api/auth/sessions');
    expect(sessionsReq.request.method).toBe('GET');
    sessionsReq.flush([]);

    service.revokeSession(4).subscribe();
    const revokeReq = httpMock.expectOne('/api/auth/sessions/4');
    expect(revokeReq.request.method).toBe('DELETE');
    revokeReq.flush({ message: 'ok' });
  });
});