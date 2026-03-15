import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ChatService } from './chat.service';
import { AuthService } from '../core/services/auth.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let socketMock: any;

  beforeEach(() => {
    socketMock = {
      connected: false,
      on: jasmine.createSpy('on'),
      emit: jasmine.createSpy('emit'),
      connect: jasmine.createSpy('connect').and.callFake(() => {
        socketMock.connected = true;
      }),
      disconnect: jasmine.createSpy('disconnect').and.callFake(() => {
        socketMock.connected = false;
      }),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUserId: jasmine
              .createSpy('getCurrentUserId')
              .and.returnValue(15),
          },
        },
      ],
    });

    service = TestBed.inject(ChatService);
    (service as any).socket = socketMock;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initializes socket listeners for chat events', () => {
    const s: any = service;
    expect(s.messageSubject).toBeDefined();
    expect(s.typingSubject).toBeDefined();
    expect(s.stopTypingSubject).toBeDefined();
    expect(s.onlineUsersSubject).toBeDefined();
  });

  it('connects and disconnects only when needed', () => {
    service.connect();
    expect(socketMock.connect).toHaveBeenCalled();

    service.connect();
    expect(socketMock.connect).toHaveBeenCalledTimes(1);

    service.disconnect();
    expect(socketMock.disconnect).toHaveBeenCalled();
  });

  it('emits room and messaging events', () => {
    service.joinRoom(8);
    expect(socketMock.emit).toHaveBeenCalledWith('join-room', {
      matchId: 8,
      userId: 15,
    });

    service.leaveRoom(8);
    expect(socketMock.emit).toHaveBeenCalledWith('leave-room', { matchId: 8 });

    service.sendMessage(8, 'hello', 15);
    expect(socketMock.emit).toHaveBeenCalledWith('send-message', {
      matchId: 8,
      content: 'hello',
      userId: 15,
    });

    service.emitTyping(8, 15, 'erivan');
    expect(socketMock.emit).toHaveBeenCalledWith('typing', {
      matchId: 8,
      userId: 15,
      username: 'erivan',
    });

    service.emitStopTyping(8, 15);
    expect(socketMock.emit).toHaveBeenCalledWith('stop-typing', {
      matchId: 8,
      userId: 15,
    });
  });

  it('uses zero fallback user id when auth user is unavailable', () => {
    const auth = TestBed.inject(AuthService) as any;
    auth.getCurrentUserId.and.returnValue(null);

    service.joinRoom(9);

    expect(socketMock.emit).toHaveBeenCalledWith('join-room', {
      matchId: 9,
      userId: 0,
    });
  });

  it('forwards websocket events through observables', () => {
    let message: any;
    let typing: any;
    let stop: any;
    let online: any;

    service.onNewMessage().subscribe((v) => (message = v));
    service.onTyping().subscribe((v) => (typing = v));
    service.onStopTyping().subscribe((v) => (stop = v));
    service.onOnlineUsers().subscribe((v) => (online = v));

    (service as any).messageSubject.next({
      id: 1,
      matchId: 8,
      userId: 15,
      content: 'x',
      createdAt: 'now',
    });
    (service as any).typingSubject.next({ userId: 15, username: 'u' });
    (service as any).stopTypingSubject.next({ userId: 15 });
    (service as any).onlineUsersSubject.next({ count: 2, userIds: [1, 2] });

    expect(message.id).toBe(1);
    expect(typing.username).toBe('u');
    expect(stop.userId).toBe(15);
    expect(online.count).toBe(2);
  });

  it('loads recent messages from REST endpoint with limit', () => {
    let response: any;

    service.getRecentMessages(22, 40).subscribe((v) => (response = v));
    const req = httpMock.expectOne('/api/chat/22/messages?limit=40');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);

    expect(response.length).toBe(1);
  });
});