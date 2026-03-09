import { Component, Input, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonItem, IonInput, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatService, ChatMessage, TypingEvent, OnlineUsersEvent } from '../../services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { environment } from '../../../environments/environment';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-match-chat',
  standalone: true,
  imports: [CommonModule, IonItem, IonInput, IonButton, IonIcon, IonBadge, FormsModule, TranslocoPipe],
  templateUrl: './match-chat.component.html',
  styleUrls: ['./match-chat.component.scss'],
})
export class MatchChatComponent implements OnInit, OnDestroy {
  @Input() matchId!: number;
  @ViewChild('content') content!: any;

  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId = 0;
  currentUsername = 'User';
  onlineCount = 0;
  typingUsers: string[] = [];
  historyLoaded = false;

  private subscriptions: Subscription[] = [];
  private typingTimeout = new Map<number, ReturnType<typeof setTimeout>>();
  private inputSubject = new Subject<void>();

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId() ?? 0;

    // Load chat history
    this.chatService.getRecentMessages(this.matchId).subscribe({
      next: (msgs) => {
        this.messages = msgs?.length ? msgs : this.buildSampleMessages();
        this.historyLoaded = true;
        this.scrollToBottom();
      },
      error: (err) => {
        this.logger.error('Failed to load chat history', err);
        this.messages = this.buildSampleMessages();
        this.historyLoaded = true;
      },
    });

    this.chatService.connect();
    this.chatService.joinRoom(this.matchId);

    // New messages
    this.subscriptions.push(
      this.chatService.onNewMessage().subscribe((msg) => {
        this.messages.push(msg);
        this.scrollToBottom();
      })
    );

    // Typing indicators
    this.subscriptions.push(
      this.chatService.onTyping().subscribe((evt) => {
        if (evt.userId !== this.currentUserId) {
          if (!this.typingUsers.includes(evt.username)) {
            this.typingUsers.push(evt.username);
          }
          // Clear after 3s
          const existing = this.typingTimeout.get(evt.userId);
          if (existing) clearTimeout(existing);
          this.typingTimeout.set(
            evt.userId,
            setTimeout(() => {
              this.typingUsers = this.typingUsers.filter((u) => u !== evt.username);
              this.typingTimeout.delete(evt.userId);
            }, 3000)
          );
        }
      })
    );

    this.subscriptions.push(
      this.chatService.onStopTyping().subscribe((evt) => {
        const timeout = this.typingTimeout.get(evt.userId);
        if (timeout) clearTimeout(timeout);
        this.typingTimeout.delete(evt.userId);
        // Remove by userId — find username from typingUsers (approximate)
        this.typingUsers = this.typingUsers.filter((_, i) => i !== this.typingUsers.length - 1 || this.typingUsers.length === 0);
      })
    );

    // Online users
    this.subscriptions.push(
      this.chatService.onOnlineUsers().subscribe((evt: OnlineUsersEvent) => {
        this.onlineCount = evt.count;
      })
    );

    // Debounce typing emission
    this.subscriptions.push(
      this.inputSubject.pipe(debounceTime(300)).subscribe(() => {
        this.chatService.emitTyping(this.matchId, this.currentUserId, this.currentUsername);
      })
    );
  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.matchId);
    this.chatService.disconnect();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.typingTimeout.forEach((t) => clearTimeout(t));
  }

  onInput() {
    this.inputSubject.next();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.chatService.sendMessage(this.matchId, this.newMessage, this.currentUserId);
    this.chatService.emitStopTyping(this.matchId, this.currentUserId);
    this.newMessage = '';
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1) return `${this.typingUsers[0]} is typing...`;
    if (this.typingUsers.length === 2)
      return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`;
    return `${this.typingUsers.length} people are typing...`;
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToBottom(300);
      }
    }, 100);
  }

  private buildSampleMessages(): ChatMessage[] {
    if (environment.production) return [];
    const now = Date.now();
    return [
      { id: 9001, matchId: this.matchId, userId: 101, content: 'Come on! This is going to be a great match ⚽', createdAt: new Date(now - 300_000).toISOString(), user: { id: 101, username: 'FootballFan42' } },
      { id: 9002, matchId: this.matchId, userId: 102, content: 'Starting XI looks strong today 💪', createdAt: new Date(now - 240_000).toISOString(), user: { id: 102, username: 'TacticsPro' } },
      { id: 9003, matchId: this.matchId, userId: 103, content: 'Prediction: 2-1 home win', createdAt: new Date(now - 180_000).toISOString(), user: { id: 103, username: 'StatsGuru' } },
      { id: 9004, matchId: this.matchId, userId: 101, content: 'That midfield pairing is 🔥', createdAt: new Date(now - 60_000).toISOString(), user: { id: 101, username: 'FootballFan42' } },
    ];
  }
}
