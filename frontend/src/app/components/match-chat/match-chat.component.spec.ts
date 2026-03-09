import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { MatchChatComponent } from './match-chat.component';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, EMPTY, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('MatchChatComponent', () => {
  let component: MatchChatComponent;
  let fixture: ComponentFixture<MatchChatComponent>;

  const mockChatService = {
    getRecentMessages: jasmine.createSpy('getRecentMessages').and.returnValue(of([])),
    connect: jasmine.createSpy('connect'),
    joinRoom: jasmine.createSpy('joinRoom'),
    leaveRoom: jasmine.createSpy('leaveRoom'),
    disconnect: jasmine.createSpy('disconnect'),
    onNewMessage: jasmine.createSpy('onNewMessage').and.returnValue(EMPTY),
    onTyping: jasmine.createSpy('onTyping').and.returnValue(EMPTY),
    onStopTyping: jasmine.createSpy('onStopTyping').and.returnValue(EMPTY),
    onOnlineUsers: jasmine.createSpy('onOnlineUsers').and.returnValue(EMPTY),
    sendMessage: jasmine.createSpy('sendMessage'),
    emitTyping: jasmine.createSpy('emitTyping'),
    emitStopTyping: jasmine.createSpy('emitStopTyping'),
  };

  const mockAuthService = {
    getCurrentUserId: () => 1,
  };

  const mockLogger = {
    log: jasmine.createSpy('log'),
    warn: jasmine.createSpy('warn'),
    error: jasmine.createSpy('error'),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MatchChatComponent,
        FormsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchChatComponent);
    component = fixture.componentInstance;
    component.matchId = 123;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sample messages when history is empty', fakeAsync(() => {
    mockChatService.getRecentMessages.and.returnValue(of([]));
    fixture.detectChanges();
    tick(200);

    // In non-production environment, sample messages are seeded
    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.historyLoaded).toBeTrue();
  }));

  it('should load sample messages when history fetch fails', fakeAsync(() => {
    mockChatService.getRecentMessages.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    tick(200);

    expect(component.messages.length).toBeGreaterThan(0);
    expect(component.historyLoaded).toBeTrue();
  }));

  it('should use real messages when available', fakeAsync(() => {
    const realMessages = [
      { id: 1, matchId: 123, userId: 2, content: 'Hello', createdAt: new Date().toISOString(), user: { id: 2, username: 'TestUser' } },
    ];
    mockChatService.getRecentMessages.and.returnValue(of(realMessages));
    fixture.detectChanges();
    tick(200);

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].content).toBe('Hello');
  }));

  it('should connect to chat room on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(200);

    expect(mockChatService.connect).toHaveBeenCalled();
    expect(mockChatService.joinRoom).toHaveBeenCalledWith(123);
  }));
});
