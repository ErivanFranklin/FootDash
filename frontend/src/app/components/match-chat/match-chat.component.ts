import { Component, Input, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-match-chat',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslocoPipe],
  templateUrl: './match-chat.component.html',
  styleUrls: ['./match-chat.component.scss'],
})
export class MatchChatComponent implements OnInit, OnDestroy {
  @Input() matchId!: number;
  @ViewChild('content') content!: any;
  
  messages: ChatMessage[] = [];
  newMessage = '';
  private subscription!: Subscription;

  // Mock user for now
  currentUserI = 1;

  private chatService = inject(ChatService);

  ngOnInit() {
    this.chatService.connect();
    this.chatService.joinRoom(this.matchId);
    
    this.subscription = this.chatService.onNewMessage().subscribe(msg => {
      this.messages.push(msg);
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.matchId);
    this.chatService.disconnect();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.matchId, this.newMessage, this.currentUserI);
    this.newMessage = '';
  }

  scrollToBottom() {
    setTimeout(() => {
        if(this.content) {
            this.content.scrollToBottom(300);
        }
    }, 100);
  }
}
