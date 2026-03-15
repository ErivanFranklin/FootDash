import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { SwUpdate } from '@angular/service-worker';

import { SwUpdateService } from './sw-update.service';
import { LoggerService } from './logger.service';

describe('SwUpdateService', () => {
  let service: SwUpdateService;
  let versionUpdates$: Subject<any>;
  const loggerMock = {
    info: jasmine.createSpy('info'),
    warn: jasmine.createSpy('warn'),
  };

  const alertControllerMock = {
    create: jasmine.createSpy('create').and.callFake(async () => ({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
    })),
  };

  const swMock = {
    isEnabled: true,
    versionUpdates: new Subject<any>(),
    checkForUpdate: jasmine.createSpy('checkForUpdate').and.returnValue(Promise.resolve(true)),
    activateUpdate: jasmine.createSpy('activateUpdate').and.returnValue(Promise.resolve()),
  };

  beforeEach(() => {
    versionUpdates$ = new Subject<any>();
    swMock.versionUpdates = versionUpdates$;
    swMock.isEnabled = true;
    swMock.checkForUpdate.calls.reset();
    swMock.activateUpdate.calls.reset();
    loggerMock.info.calls.reset();
    loggerMock.warn.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });
    service = TestBed.inject(SwUpdateService);
  });

  it('logs and exits when service worker is disabled', () => {
    swMock.isEnabled = false;

    service.init();

    expect(loggerMock.info).toHaveBeenCalled();
    expect(swMock.checkForUpdate).not.toHaveBeenCalled();
  });

  it('prompts update only on VERSION_READY events', () => {
    const promptSpy = spyOn<any>(service, 'promptUpdate').and.returnValue(Promise.resolve());

    service.init();
    versionUpdates$.next({ type: 'VERSION_DETECTED' });
    versionUpdates$.next({ type: 'VERSION_READY' });

    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(swMock.checkForUpdate).toHaveBeenCalled();
  });

  it('logs warning when checkForUpdate fails', async () => {
    swMock.checkForUpdate.and.returnValue(Promise.reject(new Error('fail')));

    service.init();
    await Promise.resolve();

    expect(loggerMock.warn).toHaveBeenCalled();
  });
});