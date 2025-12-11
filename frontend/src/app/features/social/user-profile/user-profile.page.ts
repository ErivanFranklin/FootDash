import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FollowButtonComponent } from '../../../components/social/follow-button/follow-button.component';
import { FeedItemComponent } from '../../../components/social/feed-item/feed-item.component';
import { FollowService } from '../../../services/social/follow.service';
import { FeedService } from '../../../services/social/feed.service';
import { User } from '../../../models/user.model';
import { Activity, PaginatedActivities } from '../../../models/social';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FollowButtonComponent,
    FeedItemComponent
  ]
})
export class UserProfilePage implements OnInit {
  userId!: number;
  user: User | null = null;
  activities: Activity[] = [];
  loading: boolean = false;
  hasMore: boolean = false;
  currentPage: number = 1;
  pageSize: number = 20;

  followerCount: number = 0;
  followingCount: number = 0;

  constructor(
    private route: ActivatedRoute,
    private followService: FollowService,
    private feedService: FeedService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      this.loadUserProfile();
      this.loadActivities();
    });
  }

  private loadUserProfile() {
    // TODO: Implement user service to get user details
    // For now, we'll use a placeholder
    this.user = {
      id: this.userId,
      username: `user${this.userId}`,
      email: `user${this.userId}@example.com`,
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Load follow stats
    this.loadFollowStats();
  }

  private loadFollowStats() {
    this.followService.getFollowStats(this.userId).subscribe({
      next: (stats) => {
        this.followerCount = stats.followersCount;
        this.followingCount = stats.followingCount;
      },
      error: (error) => {
        console.error('Error loading follow stats:', error);
      }
    });
  }

  private loadActivities() {
    if (this.loading) return;

    this.loading = true;
    this.feedService.getUserActivity(this.userId, { page: this.currentPage, limit: this.pageSize })
      .subscribe({
        next: (result: PaginatedActivities) => {
          if (this.currentPage === 1) {
            this.activities = result.activities;
          } else {
            this.activities = [...this.activities, ...result.activities];
          }
          this.hasMore = result.hasMore;
          this.currentPage++;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading activities:', error);
          this.loading = false;
        }
      });
  }

  loadMoreActivities() {
    if (!this.loading && this.hasMore) {
      this.loadActivities();
    }
  }

  onFollowChanged(event: { isFollowing: boolean; followerCount: number }) {
    this.followerCount = event.followerCount;
  }

  onActivityClicked(activity: Activity) {
    // TODO: Navigate to relevant page based on activity type
    console.log('Activity clicked:', activity);
  }

  onUserClicked(userId: number) {
    // TODO: Navigate to user profile
    console.log('User clicked:', userId);
  }

  onMatchClicked(matchId: number) {
    // TODO: Navigate to match details
    console.log('Match clicked:', matchId);
  }

  trackByActivityId(index: number, activity: Activity): number {
    return activity.id;
  }
}
