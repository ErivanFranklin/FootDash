import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './web-socket.service';
import { take } from 'rxjs';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockSocket: any;
  let mockSocialSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jasmine.createSpy('on'),
      off: jasmine.createSpy('off'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
      connected: true
    };
    mockSocialSocket = {
      on: jasmine.createSpy('on'),
      off: jasmine.createSpy('off'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
      connected: true
    };

    TestBed.configureTestingModule({
      providers: [WebSocketService]
    });
    service = TestBed.inject(WebSocketService);

    (service as any).socket = mockSocket;
    (service as any).socialSocket = mockSocialSocket;
    (service as any).initialized = true;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return connection status', (done) => {
    service.connectionStatus().pipe(take(1)).subscribe(status => {
      expect(status).toBe('disconnected');
      done();
    });
  });

  it('should send subscribe-match when requested', () => {
    service.subscribeToMatch('match1');
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribe-match', 'match1');
  });

  it('should unsubscribe from match', () => {
    service.unsubscribeFromMatch('match1');
    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe-match', 'match1');
  });

  it('should subscribe to social events', () => {
    service.subscribeToSocial('match', 123);
    expect(mockSocialSocket.emit).toHaveBeenCalledWith('subscribe-social', { targetType: 'match', targetId: 123 });
  });

  it('should setup social event listener', (done) => {
    let handler: any;
    mockSocialSocket.on.and.callFake((event: string, h: any) => {
      if (event === 'social-event') handler = h;
    });

    service.onSocialEvent().subscribe(event => {
      expect(event.type).toBe('comment');
      done();
    });

    expect(handler).toBeDefined();
    handler({ type: 'comment' });
  });

  it('should disconnect sockets on logout', () => {
    service.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockSocialSocket.disconnect).toHaveBeenCalled();
    expect((service as any).initialized).toBeFalse();
  });
});
