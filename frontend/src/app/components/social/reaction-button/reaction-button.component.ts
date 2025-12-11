import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { map } from 'rxjs/operators';
import { ReactionType, ReactionSummary, ReactionTargetType } from '../../../models/social';
import { ReactionsService } from '../../../services/social/reactions.service';
import { WebsocketService, SocialEvent } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reaction-button',
  templateUrl: './reaction-button.component.html',
  styleUrls: ['./reaction-button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReactionButtonComponent implements OnInit, OnChanges, OnDestroy {
  @Input() targetType!: ReactionTargetType;
  @Input() targetId!: number;
  @Input() summary?: ReactionSummary;
  @Input() showText: boolean = true;
  @Input() size: 'small' | 'default' = 'default';

  userReaction?: ReactionType;
  totalReactions: number = 0;
  topReactions: { type: ReactionType; count: number }[] = [];
  reacting: boolean = false;

  readonly ReactionType = ReactionType;

  private socialSubscription?: Subscription;

  private reactionsService = inject(ReactionsService);
  private popoverController = inject(PopoverController);
  private websocketService = inject(WebsocketService);

  ngOnInit() {
    this.updateReactionData();
    this.setupWebSocketSubscription();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['summary']) {
      this.updateReactionData();
    }
    if ((changes['targetType'] || changes['targetId']) && this.targetType && this.targetId) {
      this.updateReactionData();
      this.setupWebSocketSubscription();
    }
  }

  ngOnDestroy() {
    if (this.socialSubscription) {
      this.socialSubscription.unsubscribe();
    }
    // Unsubscribe from WebSocket
    if (this.targetType && this.targetId) {
      this.websocketService.unsubscribeFromSocial(
        this.targetType === ReactionTargetType.MATCH ? 'match' : 'prediction',
        this.targetId
      );
    }
  }

  private setupWebSocketSubscription() {
    // Clean up existing subscription
    if (this.socialSubscription) {
      this.socialSubscription.unsubscribe();
    }

    // Unsubscribe from previous target if exists
    if (this.targetType && this.targetId) {
      this.websocketService.unsubscribeFromSocial(
        this.targetType === ReactionTargetType.MATCH ? 'match' : 'prediction',
        this.targetId
      );
    }

    // Subscribe to new target
    if (this.targetType && this.targetId) {
      const targetType = this.targetType === ReactionTargetType.MATCH ? 'match' : 'prediction';
      this.websocketService.subscribeToSocial(targetType, this.targetId);

      // Listen for real-time reaction events
      this.socialSubscription = this.websocketService.onSocialEvent().subscribe((event: SocialEvent) => {
        if (event.targetType === targetType && event.targetId === this.targetId && event.type === 'reaction') {
          this.handleReactionUpdate(event);
        }
      });
    }
  }

  private handleReactionUpdate(event: SocialEvent) {
    // Update the reaction summary with real-time data
    this.updateReactionDataFromSummary(event.data.summary);
  }

  private updateReactionData() {
    if (this.summary) {
      this.totalReactions = this.summary.totalCount;
      this.userReaction = this.summary.userReaction;
      this.topReactions = this.summary.topReactions.slice(0, 3); // Show top 3 reactions
    }
  }

  async showReactionPicker(event: Event) {
    const popover = await this.popoverController.create({
      component: ReactionPickerComponent,
      event: event,
      translucent: true,
      componentProps: {
        currentReaction: this.userReaction,
        onReactionSelected: (reaction: ReactionType | null) => this.onReactionSelected(reaction)
      }
    });

    await popover.present();
  }

  private onReactionSelected(reaction: ReactionType | null) {
    if (this.reacting) return;

    this.reacting = true;

    if (reaction === null) {
      // Remove reaction
      if (this.userReaction) {
        this.reactionsService.removeReaction(this.targetType, this.targetId)
          .subscribe({
            next: () => {
              this.userReaction = undefined;
              this.totalReactions = Math.max(0, this.totalReactions - 1);
              this.updateTopReactions();
              this.reacting = false;
            },
            error: (error) => {
              console.error('Error removing reaction:', error);
              this.reacting = false;
            }
          });
      }
    } else {
      // Add or update reaction
      const request = {
        targetType: this.targetType,
        targetId: this.targetId,
        reactionType: reaction
      };

      this.reactionsService.addReaction(request)
        .subscribe({
          next: () => {
            this.userReaction = reaction;
            if (!this.userReaction) {
              this.totalReactions++;
            }
            this.updateTopReactions();
            this.reacting = false;
          },
          error: (error) => {
            console.error('Error adding reaction:', error);
            this.reacting = false;
          }
        });
    }

    this.popoverController.dismiss();
  }

  private updateTopReactions() {
    // This would be updated from the summary, but for now we'll simulate
    // In a real implementation, you'd refresh the summary from the service
  }

  getReactionIcon(type: ReactionType): string {
    switch (type) {
      case ReactionType.LIKE: return 'thumbs-up';
      case ReactionType.LOVE: return 'heart';
      case ReactionType.LAUGH: return 'happy';
      case ReactionType.WOW: return 'eye';
      case ReactionType.SAD: return 'sad';
      case ReactionType.ANGRY: return 'flame';
      default: return 'thumbs-up';
    }
  }

  getReactionColor(type: ReactionType): string {
    switch (type) {
      case ReactionType.LIKE: return 'primary';
      case ReactionType.LOVE: return 'danger';
      case ReactionType.LAUGH: return 'warning';
      case ReactionType.WOW: return 'tertiary';
      case ReactionType.SAD: return 'medium';
      case ReactionType.ANGRY: return 'danger';
      default: return 'primary';
    }
  }

  private updateReactionDataFromSummary(summary: ReactionSummary) {
    this.totalReactions = summary.totalCount;
    this.topReactions = summary.topReactions || [];
    // Update user reaction if available in summary
    if (summary.userReaction) {
      this.userReaction = summary.userReaction;
    }
  }
}

// Internal component for reaction picker
@Component({
  selector: 'app-reaction-picker',
  template: `
    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col *ngFor="let reaction of availableReactions" size="2">
            <ion-button
              fill="clear"
              size="large"
              [color]="getReactionColor(reaction)"
              (click)="selectReaction(reaction)">
              <ion-icon [name]="getReactionIcon(reaction)" size="large"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
        <ion-row *ngIf="currentReaction">
          <ion-col>
            <ion-button
              fill="outline"
              expand="block"
              color="medium"
              (click)="selectReaction(null)">
              Remove Reaction
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReactionPickerComponent {
  @Input() currentReaction?: ReactionType;
  @Input() onReactionSelected!: (reaction: ReactionType | null) => void;

  availableReactions = [
    ReactionType.LIKE,
    ReactionType.LOVE,
    ReactionType.LAUGH,
    ReactionType.WOW,
    ReactionType.SAD,
    ReactionType.ANGRY
  ];

  readonly ReactionType = ReactionType;

  selectReaction(reaction: ReactionType | null) {
    this.onReactionSelected(reaction);
  }

  getReactionIcon(type: ReactionType): string {
    switch (type) {
      case ReactionType.LIKE: return 'thumbs-up';
      case ReactionType.LOVE: return 'heart';
      case ReactionType.LAUGH: return 'happy';
      case ReactionType.WOW: return 'eye';
      case ReactionType.SAD: return 'sad';
      case ReactionType.ANGRY: return 'flame';
      default: return 'thumbs-up';
    }
  }

  getReactionColor(type: ReactionType): string {
    switch (type) {
      case ReactionType.LIKE: return 'primary';
      case ReactionType.LOVE: return 'danger';
      case ReactionType.LAUGH: return 'warning';
      case ReactionType.WOW: return 'tertiary';
      case ReactionType.SAD: return 'medium';
      case ReactionType.ANGRY: return 'danger';
      default: return 'primary';
    }
  }
}
