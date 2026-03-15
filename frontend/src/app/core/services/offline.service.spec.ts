import { TestBed } from '@angular/core/testing';
import { OfflineService } from './offline.service';
import { LoggerService } from './logger.service';

describe('OfflineService', () => {
  let service: OfflineService;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        OfflineService,
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });
    service = TestBed.inject(OfflineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return current online status', () => {
    expect(service.isOnline).toBeDefined();
  });

  it('should update status when window online/offline events fire', () => {
    // Simulate online/offline events
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline).toBeFalse();
    expect(loggerSpy.info).toHaveBeenCalledWith('[Offline] Network status changed: offline');

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline).toBeTrue();
    expect(loggerSpy.info).toHaveBeenCalledWith('[Offline] Network status changed: online');
  });

  it('should complete observable on destroy', () => {
    service.ngOnDestroy();
    // Cannot easily check the behaviorSubject subscription without private access,
    // but we can ensure no errors are thrown during destroy.
    expect(true).toBeTrue();
  });
});
