import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular';

import { OfflineQueueService } from './offline-queue.service';
import { OfflineService } from './offline.service';
import { LoggerService } from './logger.service';

describe('OfflineQueueService', () => {
  let service: OfflineQueueService;
  let httpMock: HttpTestingController;
  let online$: BehaviorSubject<boolean>;

  const loggerMock = {
    info: jasmine.createSpy('info'),
    error: jasmine.createSpy('error'),
  };

  const toastMock = {
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
  };

  beforeEach(() => {
    localStorage.clear();
    online$ = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: OfflineService,
          useValue: { isOnline$: online$.asObservable() },
        },
        { provide: LoggerService, useValue: loggerMock },
        {
          provide: ToastController,
          useValue: {
            create: jasmine
              .createSpy('create')
              .and.callFake(async () => toastMock),
          },
        },
      ],
    });

    service = TestBed.inject(OfflineQueueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('queues predictions and reports pending count', () => {
    service.queue({ matchId: 10, homeScore: 2, awayScore: 1 });

    expect(service.pendingCount()).toBe(1);
    expect(service.getQueue()[0]).toEqual(
      jasmine.objectContaining({ matchId: 10, homeScore: 2, awayScore: 1 }),
    );
    expect(loggerMock.info).toHaveBeenCalled();
  });

  it('flushes queued predictions and clears queue with success toast', async () => {
    service.queue({ matchId: 10, homeScore: 2, awayScore: 1 });
    service.queue({ matchId: 20, homeScore: 1, awayScore: 1 });

    const flushPromise = service.flushQueue();

    await Promise.resolve();

    const req1 = httpMock.expectOne('/api/gamification/predict');
    expect(req1.request.method).toBe('POST');
    req1.flush({ ok: true });

    await Promise.resolve();

    const req2 = httpMock.expectOne('/api/gamification/predict');
    expect(req2.request.method).toBe('POST');
    req2.flush({ ok: true });

    await flushPromise;

    expect(service.pendingCount()).toBe(0);
    const toastCtrl = TestBed.inject(ToastController) as any;
    expect(toastCtrl.create).toHaveBeenCalled();
    expect(toastMock.present).toHaveBeenCalled();
  });

  it('stops flushing on first sync error and keeps remaining queue', async () => {
    service.queue({ matchId: 10, homeScore: 2, awayScore: 1 });
    service.queue({ matchId: 20, homeScore: 1, awayScore: 1 });

    const flushPromise = service.flushQueue();

    await Promise.resolve();

    const req1 = httpMock.expectOne('/api/gamification/predict');
    req1.flush({ message: 'fail' }, { status: 500, statusText: 'Error' });

    await flushPromise;

    expect(service.pendingCount()).toBe(2);
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('triggers flush when connectivity changes to online', () => {
    spyOn(service, 'flushQueue').and.returnValue(Promise.resolve());

    online$.next(true);

    expect(service.flushQueue).toHaveBeenCalled();
  });
});