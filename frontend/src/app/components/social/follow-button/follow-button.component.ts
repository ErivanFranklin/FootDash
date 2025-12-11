import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
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
  followingCount: number = 0;
  loading: boolean = false;

  private followService = inject(FollowService);

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
    this.followService.getFollowStats(this.targetUserId).subscribe({
      next: (stats) => {
        this.followerCount = stats.followersCount;
        this.followingCount = stats.followingCount;
      },
      error: (error) => {
        console.error('Error getting follow stats:', error);
      }
    });
  }

  toggleFollow() {
    if (this.loading || !this.targetUserId) return;

    this.loading = true;

    this.loading = true;

    if (this.isFollowing) {
      this.followService.unfollowUser(this.targetUserId).subscribe({
        next: () => {
          this.isFollowing = false;
          this.followerCount -= 1;
          this.loading = false;
          this.followChanged.emit({
            isFollowing: this.isFollowing,
            followerCount: this.followerCount
          });
        },
        error: (err: any) => {
          console.error('Error unfollowing user:', err);
          this.loading = false;
        }
      });
    } else {
      this.followService.followUser({ followingId: this.targetUserId }).subscribe({
        next: () => {
          this.isFollowing = true;
          this.followerCount += 1;
          this.loading = false;
          this.followChanged.emit({
            isFollowing: this.isFollowing,
            followerCount: this.followerCount
          });
        },
        error: (err: any) => {
          console.error('Error following user:', err);
          this.loading = false;
        }
      });
    }
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
