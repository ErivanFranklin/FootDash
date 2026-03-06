import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, IonAvatar, IonGrid, IonRow, IonCol, IonText, IonList, IonListHeader, IonLabel, IonCard, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FollowButtonComponent } from '../../../components/social/follow-button/follow-button.component';
import { FeedItemComponent } from '../../../components/social/feed-item/feed-item.component';
import { BadgeCardComponent } from '../../../components/gamification/badge-card/badge-card.component';
import { GamificationService, BadgeResponse } from '../../../services/gamification.service';
import { FollowService } from '../../../services/social/follow.service';
import { FeedService } from '../../../services/social/feed.service';
import { ReportsService } from '../../../services/social/reports.service';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/user.model';
import { Activity, PaginatedActivities, ReportTargetType, ReportReason } from '../../../models/social';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoggerService } from '../../../core/services/logger.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, IonAvatar, IonGrid, IonRow, IonCol, IonText, IonList, IonListHeader, IonLabel, IonCard, IonCardContent, IonSpinner,
    FollowButtonComponent,
    FeedItemComponent,
    BadgeCardComponent,
    RouterLink,
    TranslocoPipe
  ]
})
export class UserProfilePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('accuracyCanvas') accuracyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pointsTrendCanvas') pointsTrendCanvas?: ElementRef<HTMLCanvasElement>;

  userId!: number;
  user: User | null = null;
  activities: Activity[] = [];
  loading: boolean = false;
  hasMore: boolean = false;
  currentPage: number = 1;
  pageSize: number = 20;

  followerCount: number = 0;
  followingCount: number = 0;
  userBadges: BadgeResponse[] = [];
  favoriteTeams: Array<{ id: number; name: string; logo?: string | null }> = [];

  predictionAccuracy = 0;
  predictionCount = 0;
  activityHeatmapCells: Array<{ date: string; count: number; level: number }> = [];

  private accuracyChart: Chart | null = null;
  private pointsTrendChart: Chart | null = null;
  private viewReady = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private followService = inject(FollowService);
  private feedService = inject(FeedService);
  private reportsService = inject(ReportsService);
  private gamificationService = inject(GamificationService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      this.loadUserProfile();
      this.loadActivities();
      this.loadFavoriteTeamsIfCurrentUser();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderStatsVisuals();
  }

  ngOnDestroy(): void {
    this.accuracyChart?.destroy();
    this.pointsTrendChart?.destroy();
  }

  private loadUserProfile() {
    this.apiService.getUserProfile(this.userId).subscribe({
      next: (profile) => {
        this.user = {
          id: this.userId,
          email: profile.email || '',
          username: profile.displayName || profile.username || `user${this.userId}`,
          avatar: profile.avatarUrl || profile.avatar,
          createdAt: profile.createdAt || new Date(),
          isPro: profile.isPro ?? false
        };
        this.loadFollowStats();
        this.loadUserBadges();
      },
      error: (error) => {
        this.logger.error('Error loading user profile:', error);
        // Fallback to minimal data so the page still renders
        this.user = {
          id: this.userId,
          email: '',
          username: `User ${this.userId}`,
          createdAt: new Date(),
          isPro: false
        };
        this.loadFollowStats();
        this.loadUserBadges();
      }
    });
  }

  private loadUserBadges() {
    this.gamificationService.getUserBadges(this.userId).subscribe({
      next: (badges) => {
        this.userBadges = badges;
      },
      error: (err) => {
        this.logger.error('Error loading user badges', err);
      },
    });
  }

  private loadFollowStats() {
    this.followService.getFollowStats(this.userId).subscribe({
      next: (stats) => {
        this.followerCount = stats.followersCount;
        this.followingCount = stats.followingCount;
      },
      error: (error) => {
        this.logger.error('Error loading follow stats:', error);
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
          this.recomputeUserStats();
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error loading activities:', error);
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

  private loadFavoriteTeamsIfCurrentUser() {
    const me = this.authService.getCurrentUserId();
    if (!me || me !== this.userId) {
      this.favoriteTeams = [];
      return;
    }

    this.favoritesService.loadFavorites('team').subscribe({
      next: (favorites) => {
        const ids = favorites.slice(0, 6).map((f) => f.entityId);
        if (!ids.length) {
          this.favoriteTeams = [];
          return;
        }

        Promise.all(ids.map((id) => firstValueFrom(this.apiService.getTeam(id)).catch(() => null))).then((teams) => {
          this.favoriteTeams = teams
            .filter((t: any) => !!t)
            .map((t: any) => ({ id: t.id, name: t.name, logo: t.logo }));
        });
      },
      error: () => {
        this.favoriteTeams = [];
      },
    });
  }

  private recomputeUserStats() {
    const predictions = this.activities.filter((a) => a.activityType === 'prediction');
    this.predictionCount = predictions.length;

    const correct = predictions.filter((a) =>
      a?.metadata?.correct === true || Number(a?.metadata?.points ?? 0) > 0
    ).length;
    this.predictionAccuracy = this.predictionCount > 0
      ? Math.round((correct / this.predictionCount) * 100)
      : 0;

    this.activityHeatmapCells = this.buildHeatmapCells(this.activities);
    this.renderStatsVisuals();
  }

  private buildHeatmapCells(activities: Activity[]) {
    const days = 35;
    const map = new Map<string, number>();
    for (const act of activities) {
      const d = new Date(act.createdAt);
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }

    const cells: Array<{ date: string; count: number; level: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = map.get(key) || 0;
      const level = count >= 4 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
      cells.push({ date: key, count, level });
    }
    return cells;
  }

  private renderStatsVisuals() {
    if (!this.viewReady) return;

    if (this.accuracyCanvas?.nativeElement) {
      this.accuracyChart?.destroy();
      this.accuracyChart = new Chart(this.accuracyCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Correct', 'Remaining'],
          datasets: [{
            data: [this.predictionAccuracy, Math.max(0, 100 - this.predictionAccuracy)],
            backgroundColor: ['#2dd36f', 'rgba(146, 148, 156, 0.25)'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false } },
        },
      });
    }

    if (this.pointsTrendCanvas?.nativeElement) {
      this.pointsTrendChart?.destroy();
      const predictions = this.activities
        .filter((a) => a.activityType === 'prediction')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-12);

      let cumulative = 0;
      const data = predictions.map((p) => {
        cumulative += Number(p?.metadata?.points ?? 0);
        return cumulative;
      });

      this.pointsTrendChart = new Chart(this.pointsTrendCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: predictions.map((p) => new Date(p.createdAt).toLocaleDateString()),
          datasets: [{
            data,
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
          },
        },
      });
    }
  }

  onFollowChanged(event: { isFollowing: boolean; followerCount: number }) {
    this.followerCount = event.followerCount;
  }

  onActivityClicked(activity: Activity) {
    switch (activity.targetType) {
      case 'match':
        this.router.navigate(['/match', activity.targetId]);
        break;
      case 'user':
        this.router.navigate(['/user-profile', activity.targetId]);
        break;
      default:
        this.router.navigate(['/match', activity.targetId]);
        break;
    }
  }

  onUserClicked(userId: number) {
    this.router.navigate(['/user-profile', userId]);
  }

  onMatchClicked(matchId: number) {
    this.router.navigate(['/match', matchId]);
  }

  trackByActivityId(index: number, activity: Activity): number {
    return activity.id;
  }
}
