import { TestBed } from '@angular/core/testing';

import { OfflineService } from './offline.service';
import { LoggerService } from './logger.service';

describe('OfflineService', () => {
  let service: OfflineService;
  const loggerMock = {
    info: jasmine.createSpy('info'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: loggerMock }],
    });
    service = TestBed.inject(OfflineService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('emits and updates state on offline and online events', (done) => {
    const values: boolean[] = [];
    const sub = service.isOnline$.subscribe((v) => {
      values.push(v);
      if (values.length >= 3) {
        expect(values).toContain(false);
        expect(values).toContain(true);
        expect(loggerMock.info).toHaveBeenCalled();
        sub.unsubscribe();
        done();
      }
    });

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });

  it('exposes current network state via getter', () => {
    expect(typeof service.isOnline).toBe('boolean');
  });
});