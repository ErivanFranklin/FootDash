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
    switch (this.activity.type) {
      case ActivityType.COMMENT_CREATED:
        return 'chatbubble';
      case ActivityType.REACTION_ADDED:
        return 'heart';
      case ActivityType.USER_FOLLOWED:
        return 'person-add';
      case ActivityType.MATCH_PREDICTION:
        return 'football';
      case ActivityType.TEAM_FOLLOWED:
        return 'star';
      default:
        return 'information-circle';
    }
  }

  getActivityColor(): string {
    switch (this.activity.type) {
      case ActivityType.COMMENT_CREATED:
        return 'primary';
      case ActivityType.REACTION_ADDED:
        return 'danger';
      case ActivityType.USER_FOLLOWED:
        return 'success';
      case ActivityType.MATCH_PREDICTION:
        return 'warning';
      case ActivityType.TEAM_FOLLOWED:
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  getActivityText(): string {
    switch (this.activity.type) {
      case ActivityType.COMMENT_CREATED:
        return `commented on ${this.activity.metadata?.targetType === 'match' ? 'a match' : 'a prediction'}`;
      case ActivityType.REACTION_ADDED:
        return `reacted to a ${this.activity.metadata?.targetType}`;
      case ActivityType.USER_FOLLOWED:
        return 'started following someone';
      case ActivityType.MATCH_PREDICTION:
        return 'made a match prediction';
      case ActivityType.TEAM_FOLLOWED:
        return 'started following a team';
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
