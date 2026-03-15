import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';

import { WebSocketService } from './web-socket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketService);
  });

  it('connect initializes sockets only once', () => {
    const initSpy = spyOn<any>(service, 'initializeSockets').and.stub();

    service.connect();
    service.connect();

    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('subscribes and unsubscribes match rooms when socket is connected', () => {
    const emit = jasmine.createSpy('emit');
    (service as any).socket = {
      connected: true,
      emit,
      disconnect: jasmine.createSpy('disconnect'),
    };

    service.subscribeToMatch(10);
    service.unsubscribeFromMatch(10);

    expect(emit).toHaveBeenCalledWith('subscribe-match', '10');
    expect(emit).toHaveBeenCalledWith('unsubscribe-match', '10');
  });

  it('does not emit subscribe when socket is disconnected but keeps state', () => {
    const emit = jasmine.createSpy('emit');
    (service as any).socket = {
      connected: false,
      emit,
      disconnect: jasmine.createSpy('disconnect'),
    };

    service.subscribeToMatch(12);

    expect((service as any).subscribedMatches.has('12')).toBeTrue();
    expect(emit).not.toHaveBeenCalled();
  });

  it('completes social stream immediately when social socket is unavailable', (done) => {
    (service as any).socialSocket = null;

    service.onSocialEvent().subscribe({
      next: () => fail('should not emit'),
      complete: () => {
        expect(true).toBeTrue();
        done();
      },
    });
  });

  it('registers and unregisters social event handlers', () => {
    const on = jasmine.createSpy('on');
    const off = jasmine.createSpy('off');
    (service as any).socialSocket = {
      on,
      off,
      disconnect: jasmine.createSpy('disconnect'),
    };

    const sub = service.onGlobalSocialEvent().subscribe();
    expect(on).toHaveBeenCalledWith('global-social-event', jasmine.any(Function));

    sub.unsubscribe();
    expect(off).toHaveBeenCalledWith('global-social-event', jasmine.any(Function));
  });

  it('disconnect tears down both sockets and resets statuses', () => {
    (service as any).socket = { disconnect: jasmine.createSpy('disconnect') };
    (service as any).socialSocket = { disconnect: jasmine.createSpy('socialDisconnect') };
    (service as any).initialized = true;

    service.disconnect();

    expect((service as any).socket).toBeNull();
    expect((service as any).socialSocket).toBeNull();
    expect((service as any).initialized).toBeFalse();
  });

  it('connectionStatus returns an observable of the status', (done) => {
    service.connectionStatus().pipe(take(1)).subscribe({
      next: (status) => {
        expect(status).toBe('disconnected');
        done();
      }
    });
  });

  it('getConnectionStatus returns a boolean observable', (done) => {
    service.getConnectionStatus().pipe(take(1)).subscribe({
      next: (status) => {
        expect(status).toBeFalse();
        done();
      }
    });
  });

  it('getSocialConnectionStatus returns an observable of Boolean', (done) => {
    service.getSocialConnectionStatus().pipe(take(1)).subscribe({
      next: (status) => {
        expect(status).toBeFalse();
        done();
      }
    });
  });

  it('subscribeToUser emits subscribe-user event', () => {
    const emit = jasmine.createSpy('emit');
    (service as any).socialSocket = { connected: true, emit, disconnect: () => {} };

    service.subscribeToUser(1);
    expect(emit).toHaveBeenCalledWith('subscribe-user', { userId: 1 });
  });

  it('unsubscribeFromUser emits unsubscribe-user event', () => {
    const emit = jasmine.createSpy('emit');
    (service as any).socialSocket = { connected: true, emit, disconnect: () => {} };

    service.unsubscribeFromUser(1);
    expect(emit).toHaveBeenCalledWith('unsubscribe-user', { userId: 1 });
  });

  it('subscribeToSocial and unsubscribeFromSocial emit correctly', () => {
    const emit = jasmine.createSpy('emit');
    (service as any).socialSocket = { connected: true, emit, disconnect: () => {} };

    service.subscribeToSocial('match', 10);
    expect(emit).toHaveBeenCalledWith('subscribe-social', { targetType: 'match', targetId: 10 });

    service.unsubscribeFromSocial('match', 10);
    expect(emit).toHaveBeenCalledWith('unsubscribe-social', { targetType: 'match', targetId: 10 });
  });

  it('onMatchUpdate returns match update stream', (done) => {
    const testData = { id: 10, score: '1-0' };
    service.onMatchUpdate().subscribe(data => {
      expect(data).toEqual(testData);
      done();
    });
    (service as any).matchUpdate$.next(testData);
  });
});
