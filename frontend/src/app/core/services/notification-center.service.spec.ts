import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Subject } from 'rxjs';

import {
  AlertType,
  NotificationCenterService,
} from './notification-center.service';
import { WebSocketService } from './web-socket.service';
import { AuthService } from './auth.service';

describe('NotificationCenterService', () => {
  let service: NotificationCenterService;
  let httpMock: HttpTestingController;
  let socialEvents$: Subject<any>;
  let isAuthenticated = true;

  const wsMock = {
    subscribeToUser: jasmine.createSpy('subscribeToUser'),
    onSocialEvent: jasmine.createSpy('onSocialEvent'),
  };

  const authMock = {
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.callFake(() => isAuthenticated),
  };

  beforeEach(() => {
    socialEvents$ = new Subject<any>();
    wsMock.onSocialEvent.and.returnValue(socialEvents$.asObservable());
    isAuthenticated = true;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: WebSocketService, useValue: wsMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(NotificationCenterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('init subscribes user room and loads unread count', () => {
    service.init(11);

    const unreadReq = httpMock.expectOne(
      (req) => req.url === '/api/alerts/unread' && req.params.get('limit') === '1',
    );
    expect(unreadReq.request.method).toBe('GET');
    unreadReq.flush([]);

    const countsReq = httpMock.expectOne('/api/alerts/counts/by-type');
    countsReq.flush({ comment: 2, reaction: 1 });

    expect(wsMock.subscribeToUser).toHaveBeenCalledWith(11);
  });

  it('increments unread count when real-time alert event arrives', (done) => {
    service.init(11);
    httpMock.expectOne('/api/alerts/unread?limit=1').flush([]);
    httpMock.expectOne('/api/alerts/counts/by-type').flush({});

    let last = -1;
    const sub = service.unreadCount$.subscribe((value) => {
      last = value;
      if (value === 1) {
        expect(last).toBe(1);
        sub.unsubscribe();
        done();
      }
    });

    socialEvents$.next({ type: 'new-alert' });
  });

  it('returns safe defaults for unauthenticated state', () => {
    isAuthenticated = false;

    service.getUnreadAlerts().subscribe((alerts) => {
      expect(alerts).toEqual([]);
    });

    service.getAlerts().subscribe((page) => {
      expect(page).toEqual({ alerts: [], total: 0, hasMore: false });
    });
  });

  it('markAsRead decrements unread count', () => {
    service.init(11);
    httpMock.expectOne('/api/alerts/unread?limit=1').flush([]);
    httpMock.expectOne('/api/alerts/counts/by-type').flush({ mention: 2 });

    service.markAsRead(5).subscribe();
    const req = httpMock.expectOne('/api/alerts/5/read');
    expect(req.request.method).toBe('PUT');
    req.flush({});

    service.unreadCount$.subscribe((count) => {
      expect(count).toBe(1);
    }).unsubscribe();
  });

  it('markAllAsRead resets unread count', () => {
    service.init(11);
    httpMock.expectOne('/api/alerts/unread?limit=1').flush([]);
    httpMock.expectOne('/api/alerts/counts/by-type').flush({ mention: 3 });

    service.markAllAsRead().subscribe();
    const req = httpMock.expectOne('/api/alerts/mark-all-read');
    expect(req.request.method).toBe('PUT');
    req.flush({});

    service.unreadCount$.subscribe((count) => {
      expect(count).toBe(0);
    }).unsubscribe();
  });

  it('provides relative time, icon and color helpers', () => {
    expect(NotificationCenterService.relativeTime(new Date().toISOString())).toBe('just now');
    expect(NotificationCenterService.iconForType(AlertType.COMMENT)).toBe('chatbubble-outline');
    expect(NotificationCenterService.iconForType('other' as any)).toBe('notifications-outline');
    expect(NotificationCenterService.colorForType(AlertType.REACTION)).toBe('danger');
    expect(NotificationCenterService.colorForType('other' as any)).toBe('primary');
  });
});