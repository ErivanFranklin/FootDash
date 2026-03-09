import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonList, IonItem, IonAvatar, IonNote, SegmentCustomEvent, IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService, LeaderboardEntry } from '../../../../services/gamification.service';
import { PageHeaderComponent } from '../../../../shared/components';
import { LoggerService } from '../../../../core/services/logger.service';
import { FollowService } from '../../../../services/social/follow.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonList, IonItem, IonAvatar, IonNote, TranslocoPipe, PageHeaderComponent, IonTabs, IonTabBar, IonTabButton],
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss']
})
export class LeaderboardPage implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  displayedLeaderboard: LeaderboardEntry[] = [];
  selectedPeriod: 'weekly' | 'monthly' | 'all-time' = 'weekly';
  selectedScope: 'global' | 'friends' = 'global';
  isLoading = false;
  readonly fallbackAvatar = '/assets/icon/favicon.png';
  private followingIds = new Set<number>();
  private currentUserId = 0;

  private gamificationService = inject(GamificationService);
  private followService = inject(FollowService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId() ?? 0;
    if (this.currentUserId) {
      this.loadFollowing();
    }
    this.loadLeaderboard();
  }

  loadFollowing() {
    this.followService.getFollowing(this.currentUserId, 1, 200).subscribe({
      next: (res) => {
        this.followingIds = new Set(res.users.map((u) => Number(u.id)));
        this.applyScopeFilter();
      },
      error: (err) => {
        this.logger.warn('Failed to load following list for leaderboard filtering', err);
      },
    });
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.gamificationService.getLeaderboard(this.selectedPeriod).subscribe({
      next: (data) => {
        this.leaderboard = data;
        this.applyScopeFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.logger.error('Error loading leaderboard', err);
        this.isLoading = false;
      }
    });
  }

  onPeriodChange(event: SegmentCustomEvent) {
    this.selectedPeriod = event.detail.value as 'weekly' | 'monthly' | 'all-time';
    this.loadLeaderboard();
  }

  // called when the ion-tabs selection changes
  onScopeChanged(event: any) {
    const tab = event.detail.tab as 'global' | 'friends' | undefined;
    if (tab) {
      this.selectedScope = tab;
      this.applyScopeFilter();
    }
  }

  private applyScopeFilter() {
    if (this.selectedScope === 'global') {
      this.displayedLeaderboard = this.leaderboard;
      return;
    }

    this.displayedLeaderboard = this.leaderboard.filter((entry) =>
      entry.userId === this.currentUserId || this.followingIds.has(entry.userId)
    );
  }

  getInitials(name?: string): string {
    const safeName = (name || '').trim();
    if (!safeName) return 'U';

    const parts = safeName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    if (img.src.endsWith(this.fallbackAvatar)) {
      return;
    }

    img.src = this.fallbackAvatar;
  }
}
