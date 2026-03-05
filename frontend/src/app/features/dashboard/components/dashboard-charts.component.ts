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
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../../services/analytics.service';
import { GamificationService } from '../../../services/gamification.service';
import { FavoritesService } from '../../../services/favorites.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';

Chart.register(...registerables);

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
    `,
  ],
  template: `
    @if (loading) {
      <div class="loading-row">
        <ion-spinner name="dots"></ion-spinner>
      </div>
    } @else {
      <div class="charts-row">
        <ion-card class="mini-chart-card" routerLink="/leaderboard">
          <ion-card-content>
            <p class="mini-label">Your Rank</p>
            <p class="mini-value" style="color: var(--ion-color-warning)">
              {{ rank ? '#' + rank : '—' }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ points }} pts</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="mini-chart-card" routerLink="/analytics/predictions">
          <ion-card-content>
            <p class="mini-label">Predictions</p>
            <p class="mini-value" [style.color]="accuracyColor">
              {{ predictionsMade > 0 ? accuracy + '%' : '—' }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ predictionsMade }} made</p>
            <div class="mini-canvas-wrapper" style="margin-top: 6px; height: 40px;">
              <canvas #predictionGauge></canvas>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="mini-chart-card" routerLink="/badges">
          <ion-card-content>
            <p class="mini-label">Badges Earned</p>
            <p class="mini-value" style="color: var(--ion-color-tertiary)">
              {{ badgesEarned }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ badgesTotal }} available</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="mini-chart-card" [routerLink]="['/teams']" [queryParams]="{ tab: 'favorites' }">
          <ion-card-content>
            <p class="mini-label">Favorite Teams</p>
            <p class="mini-value" style="color: var(--ion-color-danger)">
              {{ favoriteCount }}
            </p>
            <p class="mini-label" style="margin-bottom:0">{{ favoriteFormLabel }}</p>
            <div class="mini-canvas-wrapper" style="margin-top: 6px; height: 36px;">
              <canvas #favoritesFormSparkline></canvas>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    }
  `,
})
export class DashboardChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly gamificationService = inject(GamificationService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly logger = inject(LoggerService);

  @ViewChild('predictionGauge') predictionGaugeRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('favoritesFormSparkline') favoritesSparklineRef?: ElementRef<HTMLCanvasElement>;

  loading = true;
  rank: number | null = null;
  points = 0;
  accuracy = 0;
  accuracyColor = 'var(--ion-color-medium)';
  predictionsMade = 0;
  badgesEarned = 0;
  badgesTotal = 0;
  favoriteCount = 0;
  favoriteFormLabel = 'No form data';

  private predictionChart: Chart | null = null;
  private formChart: Chart | null = null;
  private viewReady = false;

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderMiniCharts();
  }

  ngOnDestroy(): void {
    this.predictionChart?.destroy();
    this.formChart?.destroy();
  }

  private loadStats() {
    this.loading = true;
    let completed = 0;
    const total = 3;
    const checkDone = () => {
      completed++;
      if (completed >= total) {
        this.loading = false;
        this.renderMiniCharts();
      }
    };

    this.gamificationService.getLeaderboard('weekly').subscribe({
      next: (entries: any[]) => {
        const userId = this.getCurrentUserId();
        const me = entries.find((e: any) => e.userId === userId);
        if (me) {
          this.rank = me.rank;
          this.points = me.points ?? 0;
          this.predictionsMade = me.predictionsCount ?? me.predictions ?? 0;
          this.accuracy = Math.round(me.accuracy ?? 0);
          this.accuracyColor = this.accuracy >= 60
            ? 'var(--ion-color-success)'
            : this.accuracy >= 45
              ? 'var(--ion-color-warning)'
              : 'var(--ion-color-danger)';
        }
        checkDone();
      },
      error: (err) => {
        this.logger.warn('Leaderboard stats unavailable', err);
        checkDone();
      },
    });

    this.gamificationService.getAllBadges().subscribe({
      next: (badges: any[]) => {
        this.badgesTotal = badges.length;
        this.badgesEarned = badges.filter((b: any) => b.earned || b.unlockedAt).length;
        checkDone();
      },
      error: (err) => {
        this.logger.warn('Badges stats unavailable', err);
        checkDone();
      },
    });

    this.favoritesService.loadFavorites('team').subscribe({
      next: (favorites: any[]) => {
        this.favoriteCount = favorites?.length ?? 0;
        this.loadFavoriteFormSparkline(favorites ?? []);
        checkDone();
      },
      error: (err) => {
        this.logger.warn('Favorites stats unavailable', err);
        checkDone();
      },
    });
  }

  private loadFavoriteFormSparkline(favorites: any[]) {
    if (!favorites.length) {
      this.favoriteFormLabel = 'No favorites yet';
      this.renderFavoriteSparkline([0, 0, 0, 0, 0]);
      return;
    }

    const ids = favorites
      .slice(0, 3)
      .map((f: any) => Number(f.entityId))
      .filter((id: number) => Number.isFinite(id));

    if (!ids.length) {
      this.renderFavoriteSparkline([0, 0, 0, 0, 0]);
      return;
    }

    forkJoin(ids.map((id: number) => this.analyticsService.getTeamAnalytics(id))).subscribe({
      next: (analyticsList: any[]) => {
        const best = analyticsList
          .filter((a) => a?.scoringTrend?.last5Matches?.length)
          .sort((a, b) => (Number(b.formRating) || 0) - (Number(a.formRating) || 0))[0];

        if (!best) {
          this.favoriteFormLabel = 'No form data';
          this.renderFavoriteSparkline([0, 0, 0, 0, 0]);
          return;
        }

        this.favoriteFormLabel = `${best.teamName}: ${Math.round(Number(best.formRating) || 0)} form`;
        this.renderFavoriteSparkline(best.scoringTrend.last5Matches);
      },
      error: () => {
        this.favoriteFormLabel = 'Form unavailable';
        this.renderFavoriteSparkline([0, 0, 0, 0, 0]);
      },
    });
  }

  private renderMiniCharts() {
    if (!this.viewReady) return;
    this.renderPredictionGauge();
    if (!this.formChart) {
      this.renderFavoriteSparkline([0, 0, 0, 0, 0]);
    }
  }

  private renderPredictionGauge() {
    if (!this.predictionGaugeRef?.nativeElement) return;
    this.predictionChart?.destroy();

    const value = Math.max(0, Math.min(100, this.accuracy || 0));
    this.predictionChart = new Chart(this.predictionGaugeRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Accuracy', 'Remaining'],
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: [
            value >= 60 ? '#2dd36f' : value >= 45 ? '#ffc409' : '#eb445a',
            'rgba(146, 148, 156, 0.25)',
          ],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
    });
  }

  private renderFavoriteSparkline(points: number[]) {
    if (!this.favoritesSparklineRef?.nativeElement) return;
    this.formChart?.destroy();

    const normalized = (points || []).slice(-5).map((p) => Number(p) || 0);
    this.formChart = new Chart(this.favoritesSparklineRef.nativeElement, {
      type: 'line',
      data: {
        labels: normalized.map((_, idx) => `M${idx + 1}`),
        datasets: [{
          data: normalized,
          borderColor: '#eb445a',
          backgroundColor: 'rgba(235, 68, 90, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
  }

  private getCurrentUserId(): number {
    return this.authService.getCurrentUserId() ?? 0;
  }
}
