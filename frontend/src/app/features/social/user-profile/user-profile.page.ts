import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { FollowButtonComponent } from '../../../components/social/follow-button/follow-button.component';
import { FeedItemComponent } from '../../../components/social/feed-item/feed-item.component';
import { FollowService } from '../../../services/social/follow.service';
import { FeedService } from '../../../services/social/feed.service';
import { ReportsService } from '../../../services/social/reports.service';
import { User } from '../../../models/user.model';
import { Activity, PaginatedActivities, ReportTargetType, ReportReason } from '../../../models/social';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';

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
    FeedItemComponent,
    TranslocoPipe
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

  private route = inject(ActivatedRoute);
  private followService = inject(FollowService);
  private feedService = inject(FeedService);
  private reportsService = inject(ReportsService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

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

  async reportUser() {
    const alert = await this.alertController.create({
      header: 'Report User',
      message: 'Why are you reporting this user?',
      inputs: [
        { name: 'reason', type: 'radio', label: 'Spam', value: ReportReason.SPAM, checked: true },
        { name: 'reason', type: 'radio', label: 'Harassment', value: ReportReason.HARASSMENT },
        { name: 'reason', type: 'radio', label: 'Inappropriate', value: ReportReason.INAPPROPRIATE },
        { name: 'reason', type: 'radio', label: 'Hate Speech', value: ReportReason.HATE_SPEECH },
        { name: 'reason', type: 'radio', label: 'Other', value: ReportReason.OTHER },
        { name: 'description', type: 'textarea', placeholder: 'Additional details (optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Report',
          handler: (data) => {
            this.reportsService.createReport({
              targetType: ReportTargetType.USER,
              targetId: this.userId,
              reason: data.reason,
              description: data.description
            }).subscribe({
              next: () => this.showToast('User reported successfully'),
              error: () => this.showToast('Error reporting user', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
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
