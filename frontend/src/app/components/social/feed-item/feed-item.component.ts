import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Activity, ActivityType } from '../../../models/social';

@Component({
  selector: 'app-feed-item',
  templateUrl: './feed-item.component.html',
  styleUrls: ['./feed-item.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
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
        return 'chatbubble';
      case ActivityType.REACTION:
        return 'heart';
      case ActivityType.FOLLOW:
        return 'person-add';
      case ActivityType.PREDICTION:
        return 'football';
      default:
        return 'information-circle';
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
}
