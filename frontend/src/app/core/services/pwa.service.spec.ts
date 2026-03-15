import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PwaService } from './pwa.service';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('PwaService', () => {
  let service: PwaService;
  const loggerMock = {
    info: jasmine.createSpy('info'),
    warn: jasmine.createSpy('warn'),
    error: jasmine.createSpy('error'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: { getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1) },
        },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });
    service = TestBed.inject(PwaService);
  });

  it('returns immediately when registration lock is active', async () => {
    (service as any).registering = true;
    await expectAsync(service.initPushNotifications()).toBeResolved();
  });

  it('warns and exits when pushPublicKey is missing', async () => {
    const previous = environment.pushPublicKey;
    (environment as any).pushPublicKey = '';

    await service.initPushNotifications();

    expect(loggerMock.warn).toHaveBeenCalled();
    (environment as any).pushPublicKey = previous;
  });

  it('converts base64 url string to uint8 array', () => {
    const out = (service as any).urlBase64ToUint8Array('SGVsbG8');
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBeGreaterThan(0);
  });
});