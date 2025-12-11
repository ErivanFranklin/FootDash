import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FeedItemComponent } from '../../../components/social/feed-item/feed-item.component';
import { FeedService } from '../../../services/social/feed.service';
import { Activity, PaginatedActivities, FeedType } from '../../../models/social';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FeedItemComponent
  ]
})
export class FeedPage implements OnInit {
  activities: Activity[] = [];
  loading: boolean = false;
  hasMore: boolean = false;
  currentPage: number = 1;
  pageSize: number = 20;

  feedType: string = 'global';
  feedTypes = FeedType;

  constructor(private feedService: FeedService) {}

  ngOnInit() {
    this.loadActivities();
  }

  private loadActivities() {
    if (this.loading) return;

    this.loading = true;
    const serviceMethod = this.feedType === 'global'
      ? this.feedService.getGlobalFeed({ page: this.currentPage, limit: this.pageSize })
      : this.feedService.getUserFeed({ page: this.currentPage, limit: this.pageSize }); // TODO: Implement personalized feed

    serviceMethod.subscribe({
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
        console.error('Error loading feed:', error);
        this.loading = false;
      }
    });
  }

  private resetAndLoad() {
    this.activities = [];
    this.currentPage = 1;
    this.hasMore = false;
    this.loadActivities();
  }

  loadMoreActivities() {
    if (!this.loading && this.hasMore) {
      this.loadActivities();
    }
  }

  refreshFeed(event: any) {
    this.resetAndLoad();
    event.target.complete();
  }

  changeFeedType(value: any) {
    this.feedType = String(value);
    this.resetAndLoad();
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
