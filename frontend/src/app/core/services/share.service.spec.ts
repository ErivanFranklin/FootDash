import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';
import { ToastController } from '@ionic/angular';
import { LoggerService } from './logger.service';

describe('ShareService', () => {
  let service: ShareService;
  let toastSpy: jasmine.SpyObj<ToastController>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        ShareService,
        { provide: ToastController, useValue: toastSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });
    service = TestBed.inject(ShareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return support status', () => {
    const supported = !!(navigator as any).share;
    expect(service.isShareSupported()).toBe(supported);
  });

  it('should share match details', async () => {
    const shareSpy = spyOn(service, 'share').and.returnValue(Promise.resolve(true));(service, 'share').and.returnValue(Promise.resolve(true));
    const match = {
      homeTeam: { name: 'Team A' },
      awayTeam: { name: 'Team B' },
      fixture: { id: 123 }
    };

    await service.shareMatch(match);atch);
    expect(shareSpy).toHaveBeenCalled();xpect(shareSpy).toHaveBeenCalled();
  });
});});
