import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';

import { ShareService } from './share.service';
import { LoggerService } from './logger.service';

describe('ShareService', () => {
  let service: ShareService;
  const toastMock = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
  };
  const toastControllerMock = {
    create: jasmine.createSpy('create').and.callFake(async () => toastMock),
  };
  const loggerMock = {
    error: jasmine.createSpy('error'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastController, useValue: toastControllerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(ShareService);
  });

  afterEach(() => {
    toastControllerMock.create.calls.reset();
    loggerMock.error.calls.reset();
    toastMock.present.calls.reset();
  });

  it('uses Web Share API when available', async () => {
    const nav = navigator as any;
    nav.share = jasmine.createSpy('share').and.returnValue(Promise.resolve());

    const ok = await service.share({ title: 'Hello' });

    expect(ok).toBeTrue();
    expect(nav.share).toHaveBeenCalledWith({ title: 'Hello' });
  });

  it('returns false on Web Share API non-abort errors and shows toast', async () => {
    const nav = navigator as any;
    nav.share = jasmine
      .createSpy('share')
      .and.returnValue(Promise.reject({ name: 'TypeError' }));

    const ok = await service.share({ title: 'Hello' });

    expect(ok).toBeFalse();
    expect(loggerMock.error).toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('falls back to clipboard copy when share api is unavailable', async () => {
    const nav = navigator as any;
    nav.share = undefined;
    const copySpy = spyOn<any>(service as any, 'copyToClipboard').and.returnValue(
      Promise.resolve(true),
    );

    const ok = await service.share({ title: 'A', text: 'B', url: 'C' });

    expect(ok).toBeTrue();
    expect(copySpy).toHaveBeenCalledWith({ title: 'A', text: 'B', url: 'C' });
  });

  it('returns false when clipboard fallback fails', async () => {
    const nav = navigator as any;
    nav.share = undefined;
    spyOn<any>(service as any, 'copyToClipboard').and.returnValue(
      Promise.resolve(false),
    );

    const ok = await service.share({ text: 'B' });

    expect(ok).toBeFalse();
  });

  it('builds and shares match details payload', async () => {
    const nav = navigator as any;
    nav.share = jasmine.createSpy('share').and.returnValue(Promise.resolve());

    await service.shareMatch({
      fixture: { id: 77, date: '2026-01-01T10:00:00.000Z' },
      teams: { home: { name: 'A' }, away: { name: 'B' } },
      goals: { home: 1, away: 0 },
    });

    expect(nav.share).toHaveBeenCalled();
    const payload = nav.share.calls.mostRecent().args[0];
    expect(payload.title).toContain('A vs B');
    expect(payload.text).toContain('Score: 1 - 0');
    expect(payload.url).toContain('/match/77');
  });
});