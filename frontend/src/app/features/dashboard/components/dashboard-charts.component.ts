import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonCard, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { GamificationService } from '../../../services/gamification.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';

Chart.register(...registerables);

interface QuickStat {
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule, RouterModule, IonCard, IonCardContent, IonSpinner],
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 16px;
      }
      .charts-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .mini-chart-card {
        --background: var(--ion-color-light);
        margin: 0;
        border-radius: 14px;
        cursor: pointer;
      }
      .mini-chart-card ion-card-content {
        padding: 12px;
      }
      .mini-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--ion-color-medium);
        margin: 0 0 2px;
      }
      .mini-value {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 6px;
      }
      .mini-canvas-wrapper {
        height: 48px;
        width: 100%;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
      .loading-row {
        text-align: center;
        padding: 12px;
      }
      .activity-ring-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 48px;
      }
      .activity-ring {
        position: relative;
        width: 48px;
        height: 48px;
      }
      .activity-ring canvas {
        width: 48px !important;
        height: 48px !important;
      }
      .ring-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 11px;
        font-weight: 700;
      }
    `,
  ],
  template: `
    @if (loading) {
      <div class="loading-row">
        <ion-spinner name="dots"></ion-spinner>
      </div>
    } @else {
      <div class="charts-row">
        <!-- Leaderboard rank -->
        <ion-card class="mini-chart-card" routerLink="/leaderboard">
          <ion-card-content>
            <p class="mini-label">Your Rank</p>
            <p class="mini-value" style="color: var(--ion-color-warning)">
              {{ rank ? '#' + rank : '—' }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ points }} pts</p>
          </ion-card-content>
        </ion-card>

        <!-- Prediction accuracy ring -->
        <ion-card class="mini-chart-card" routerLink="/analytics/predictions">
          <ion-card-content>
            <p class="mini-label">Predictions</p>
            <p class="mini-value" [style.color]="accuracyColor">
              {{ predictionsMade > 0 ? accuracy + '%' : '—' }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ predictionsMade }} made</p>
          </ion-card-content>
        </ion-card>

        <!-- Badges earned -->
        <ion-card class="mini-chart-card" routerLink="/badges">
          <ion-card-content>
            <p class="mini-label">Badges Earned</p>
            <p class="mini-value" style="color: var(--ion-color-tertiary)">
              {{ badgesEarned }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ badgesTotal }} available</p>
          </ion-card-content>
        </ion-card>

        <!-- Favorites count -->
        <ion-card class="mini-chart-card" [routerLink]="['/teams']" [queryParams]="{ tab: 'favorites' }">
          <ion-card-content>
            <p class="mini-label">Favorite Teams</p>
            <p class="mini-value" style="color: var(--ion-color-danger)">
              {{ favoriteCount }}
            </p>
            <p class="mini-label" style="margin-bottom:0">teams followed</p>
          </ion-card-content>
        </ion-card>
      </div>
    }
  `,
})
export class DashboardChartsComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  loading = true;
  rank: number | null = null;
  points = 0;
  accuracy = 0;
  accuracyColor = 'var(--ion-color-medium)';
  predictionsMade = 0;
  badgesEarned = 0;
  badgesTotal = 0;
  favoriteCount = 0;

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats() {
    this.loading = true;
    let completed = 0;
    const total = 3;
    const checkDone = () => {
      completed++;
      if (completed >= total) {
        this.loading = false;
      }
    };

    // Leaderboard rank
    this.gamificationService.getLeaderboard('weekly').subscribe({
      next: (entries: any[]) => {
        // Find current user in leaderboard
        const userId = this.getCurrentUserId();
        const me = entries.find((e: any) => e.userId === userId);
        if (me) {
          this.rank = me.rank;
          this.points = me.points ?? 0;
        }
        checkDone();
      },
      error: () => checkDone(),
    });

    // Badges
    this.gamificationService.getAllBadges().subscribe({
      next: (badges: any[]) => {
        this.badgesTotal = badges.length;
        this.badgesEarned = badges.filter((b: any) => b.earned || b.unlockedAt).length;
        checkDone();
      },
      error: () => checkDone(),
    });

    // Favorites
    this.favoritesService.loadFavorites('team').subscribe({
      next: (favorites: any[]) => {
        this.favoriteCount = favorites?.length ?? 0;
        checkDone();
      },
      error: () => checkDone(),
    });
  }

  private getCurrentUserId(): number {
    return this.authService.getCurrentUserId() ?? 0;
  }
}
