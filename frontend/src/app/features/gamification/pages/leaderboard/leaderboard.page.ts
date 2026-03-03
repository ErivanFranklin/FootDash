import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonList, IonItem, IonAvatar, IonNote, SegmentCustomEvent } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService, LeaderboardEntry } from '../../../../services/gamification.service';
import { PageHeaderComponent } from '../../../../shared/components';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonList, IonItem, IonAvatar, IonNote, TranslocoPipe, PageHeaderComponent],
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss']
})
export class LeaderboardPage implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  selectedPeriod: 'weekly' | 'monthly' | 'all-time' = 'weekly';
  isLoading = false;
  readonly fallbackAvatar = '/assets/icon/favicon.png';

  private gamificationService = inject(GamificationService);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.gamificationService.getLeaderboard(this.selectedPeriod).subscribe({
      next: (data) => {
        this.leaderboard = data;
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
