import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAvatar, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Activity, ActivityType } from '../../../models/social';

@Component({
  selector: 'app-feed-item',
  templateUrl: './feed-item.component.html',
  styleUrls: ['./feed-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonAvatar, IonIcon, IonCard, IonCardContent, RouterModule]
})
export class FeedItemComponent {
  @Input() activity!: Activity;
  @Input() showActions: boolean = true;

  @Output() itemClicked = new EventEmitter<Activity>();
  @Output() userClicked = new EventEmitter<number>();
  @Output() matchClicked = new EventEmitter<number>();

  readonly ActivityType = ActivityType;

  onItemClick() {
    this.itemClicked.emit(this.activity);
  }

  onUserClick(userId: number, event: Event) {
    event.stopPropagation();
    this.userClicked.emit(userId);
  }

  onMatchClick(matchId: number, event: Event) {
    event.stopPropagation();
    this.matchClicked.emit(matchId);
  }

  getActivityIcon(): string {
    switch (this.activity.activityType) {
      case ActivityType.COMMENT:
        return 'chatbubble-outline';
      case ActivityType.REACTION:
        return 'sparkles-outline';
      case ActivityType.FOLLOW:
        return 'person-add-outline';
      case ActivityType.PREDICTION:
        return 'football-outline';
      default:
        return 'information-circle-outline';
    }
  }

  getActivityColor(): string {
    switch (this.activity.activityType) {
      case ActivityType.COMMENT:
        return 'primary';
      case ActivityType.REACTION:
        return 'danger';
      case ActivityType.FOLLOW:
        return 'success';
      case ActivityType.PREDICTION:
        return 'warning';
      default:
        return 'medium';
    }
  }

  getActivityText(): string {
    switch (this.activity.activityType) {
      case ActivityType.COMMENT:
        return `commented on ${this.activity.targetType}`;
      case ActivityType.REACTION:
        return `reacted to a ${this.activity.targetType}`;
      case ActivityType.FOLLOW:
        return 'started following someone';
      case ActivityType.PREDICTION:
        return 'made a match prediction';
      default:
        return 'performed an activity';
    }
  }

  getTimeAgo(): string {
    const now = new Date();
    const activityTime = new Date(this.activity.createdAt);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return activityTime.toLocaleDateString();
  }

  shouldShowMatchLink(): boolean {
    return !!(this.activity.metadata?.matchId && this.activity.metadata?.matchName);
  }

  shouldShowUserLink(): boolean {
    return !!(this.activity.metadata?.targetUserId && this.activity.metadata?.targetUsername);
  }

  getUserInitials(): string {
    const name = String(this.activity.userName || 'Unknown').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
}
