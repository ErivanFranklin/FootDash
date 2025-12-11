import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FollowService } from '../../../services/social/follow.service';

@Component({
  selector: 'app-follow-button',
  templateUrl: './follow-button.component.html',
  styleUrls: ['./follow-button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class FollowButtonComponent implements OnInit, OnChanges {
  @Input() targetUserId!: number;
  @Input() showText: boolean = true;
  @Input() size: 'small' | 'default' = 'default';
  @Input() fill: 'solid' | 'outline' | 'clear' = 'solid';

  @Output() followChanged = new EventEmitter<{ isFollowing: boolean; followerCount: number }>();

  isFollowing: boolean = false;
  followerCount: number = 0;
  loading: boolean = false;

  constructor(private followService: FollowService) {}

  ngOnInit() {
    this.loadFollowStatus();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetUserId'] && !changes['targetUserId'].firstChange) {
      this.loadFollowStatus();
    }
  }

  private loadFollowStatus() {
    if (!this.targetUserId) return;

    this.loading = true;

    // Check if current user is following this user
    this.followService.isFollowing(this.targetUserId).subscribe({
      next: (isFollowing: boolean) => {
        this.isFollowing = isFollowing;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error checking follow status:', error);
        this.loading = false;
      }
    });

    // Get follower count
    this.followService.getFollowerCount(this.targetUserId).subscribe({
      next: (count: number) => {
        this.followerCount = count;
      },
      error: (error) => {
        console.error('Error getting follower count:', error);
      }
    });
  }

  toggleFollow() {
    if (this.loading || !this.targetUserId) return;

    this.loading = true;

    const action = this.isFollowing
      ? this.followService.unfollow(this.targetUserId)
      : this.followService.follow(this.targetUserId);

    action.subscribe({
      next: () => {
        this.isFollowing = !this.isFollowing;
        this.followerCount += this.isFollowing ? 1 : -1;
        this.loading = false;
        this.followChanged.emit({
          isFollowing: this.isFollowing,
          followerCount: this.followerCount
        });
      },
      error: (error) => {
        console.error('Error toggling follow:', error);
        this.loading = false;
        // TODO: Show error toast
      }
    });
  }

  getButtonText(): string {
    if (!this.showText) return '';

    return this.isFollowing ? 'Following' : 'Follow';
  }

  getButtonIcon(): string {
    return this.isFollowing ? 'checkmark-circle' : 'person-add';
  }

  getButtonColor(): string {
    return this.isFollowing ? 'medium' : 'primary';
  }
}
