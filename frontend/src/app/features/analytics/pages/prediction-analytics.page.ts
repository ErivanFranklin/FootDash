import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonBadge, IonIcon, IonRefresher, IonRefresherContent,
  IonChip, IonNote
} from '@ionic/angular/standalone';
import { AnalyticsService } from '../../../services/analytics.service';
import { PredictionResult } from '../../../models/analytics.model';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-prediction-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonBadge, IonIcon, IonRefresher, IonRefresherContent,
    IonChip, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Prediction Analytics</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="activeTab" (ionChange)="onTabChange($event)">
          <ion-segment-button value="upcoming">
            <ion-label>Upcoming</ion-label>
          </ion-segment-button>
          <ion-segment-button value="performance">
            <ion-label>Performance</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading predictions...</p>
        </div>
      }

      <!-- UPCOMING PREDICTIONS TAB -->
      @if (!loading && activeTab === 'upcoming') {
        <div class="tab-content">
          <!-- Summary Bar -->
          <div class="summary-bar">
            <div class="summary-item">
              <span class="summary-value">{{ predictions.length }}</span>
              <span class="summary-label">Predictions</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">{{ highConfidenceCount }}</span>
              <span class="summary-label">High Confidence</span>
            </div>
            <div class="summary-item">
              <span class="summary-value">{{ averageConfidence }}%</span>
              <span class="summary-label">Avg Confidence</span>
            </div>
          </div>

          <ion-card>
            <ion-card-header>
              <ion-card-title>BTTS and Over/Under Snapshot</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (probabilitySamplesLoading) {
                <div class="loading-container" style="padding: 16px 0;">
                  <ion-spinner name="dots"></ion-spinner>
                </div>
              } @else {
                <div class="stats-grid">
                  <ion-card class="stat-card">
                    <ion-card-content>
                      <div class="stat-value accuracy">{{ avgBttsYes | number:'1.0-0' }}%</div>
                      <div class="stat-label">BTTS Yes (avg)</div>
                    </ion-card-content>
                  </ion-card>
                  <ion-card class="stat-card">
                    <ion-card-content>
                      <div class="stat-value">{{ avgOver25 | number:'1.0-0' }}%</div>
                      <div class="stat-label">Over 2.5 (avg)</div>
                    </ion-card-content>
                  </ion-card>
                </div>
              }
            </ion-card-content>
          </ion-card>

          <!-- Confidence Distribution Chart -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Confidence Distribution</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas #confidenceChart></canvas>
            </ion-card-content>
          </ion-card>

          <!-- Outcome Distribution Chart -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Predicted Outcomes</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <canvas #outcomeChart></canvas>
            </ion-card-content>
          </ion-card>

          <!-- Prediction Cards -->
          @for (pred of predictions; track pred.matchId) {
            <ion-card class="prediction-card" (click)="goToMatch(pred.matchId)">
              <ion-card-content>
                <div class="match-header-row">
                  <div class="teams">
                    <span class="team home">{{ pred.homeTeam }}</span>
                    <span class="vs">vs</span>
                    <span class="team away">{{ pred.awayTeam }}</span>
                  </div>
                  <ion-badge [color]="getConfidenceColor(pred.confidence)">
                    {{ pred.confidence | uppercase }}
                  </ion-badge>
                </div>

                <div class="probabilities">
                  <div class="prob-bar">
                    <div class="prob-segment home-win"
                       [style.width.%]="asPercent(pred.homeWinProbability)">
                     {{ asPercent(pred.homeWinProbability) | number:'1.0-0' }}%
                    </div>
                    <div class="prob-segment draw"
                       [style.width.%]="asPercent(pred.drawProbability)">
                     {{ asPercent(pred.drawProbability) | number:'1.0-0' }}%
                    </div>
                    <div class="prob-segment away-win"
                       [style.width.%]="asPercent(pred.awayWinProbability)">
                     {{ asPercent(pred.awayWinProbability) | number:'1.0-0' }}%
                    </div>
                  </div>
                  <div class="prob-labels">
                    <span>Home</span>
                    <span>Draw</span>
                    <span>Away</span>
                  </div>
                </div>

                <div class="prediction-footer">
                  <ion-chip color="primary" [outline]="true">
                    <ion-label>Most Likely: {{ getMostLikelyLabel(pred.mostLikely) }}</ion-label>
                  </ion-chip>
                  @if (pred.insights && pred.insights.length > 0) {
                    <ion-note>{{ pred.insights[0] }}</ion-note>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          } @empty {
            <div class="empty-state">
              <ion-icon name="analytics-outline" class="empty-icon"></ion-icon>
              <h3>No Upcoming Predictions</h3>
              <p>Predictions will appear here when matches are scheduled.</p>
            </div>
          }

          @if (predictions.length > 0) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>Recent Predictions</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="recent-table">
                  @for (pred of predictions.slice(0, 8); track pred.matchId) {
                    <div class="recent-row" (click)="goToMatch(pred.matchId)">
                      <span class="match-col">{{ pred.homeTeam }} vs {{ pred.awayTeam }}</span>
                      <span class="outcome-col">{{ getMostLikelyLabel(pred.mostLikely) }}</span>
                      <span class="confidence-col">{{ asPercent(getMostLikelyPercent(pred)) | number:'1.0-0' }}%</span>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <!-- PERFORMANCE TAB -->
      @if (!loading && activeTab === 'performance') {
        <div class="tab-content">
          @if (statsLoading) {
            <div class="loading-container">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Loading performance data...</p>
            </div>
          } @else {
            <!-- Stats Summary Cards -->
            @if (performanceStats) {
              <div class="stats-grid">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-value">{{ performanceStats.totalPredictions || 0 }}</div>
                    <div class="stat-label">Total Predictions</div>
                  </ion-card-content>
                </ion-card>
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-value accuracy">{{ (performanceStats.accuracy || 0) | number:'1.1-1' }}%</div>
                    <div class="stat-label">Accuracy</div>
                  </ion-card-content>
                </ion-card>
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-value">{{ performanceStats.correct || 0 }}</div>
                    <div class="stat-label">Correct</div>
                  </ion-card-content>
                </ion-card>
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-value">{{ performanceStats.incorrect || 0 }}</div>
                    <div class="stat-label">Incorrect</div>
                  </ion-card-content>
                </ion-card>
              </div>

              <!-- Accuracy by Strategy Chart -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Accuracy by Strategy</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <canvas #strategyChart></canvas>
                </ion-card-content>
              </ion-card>

              <!-- Accuracy Trend Chart -->
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Prediction Accuracy Trend</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <canvas #trendChart></canvas>
                </ion-card-content>
              </ion-card>

              <!-- Strategy Breakdown -->
              @if (performanceStats.byStrategy && performanceStats.byStrategy.length > 0) {
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>Strategy Breakdown</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    @for (strategy of performanceStats.byStrategy; track strategy.name) {
                      <div class="strategy-row">
                        <div class="strategy-info">
                          <span class="strategy-name">{{ strategy.name }}</span>
                          <span class="strategy-count">{{ strategy.total }} predictions</span>
                        </div>
                        <div class="strategy-bar-container">
                          <div class="strategy-bar"
                               [style.width.%]="strategy.accuracy"
                               [class.high]="strategy.accuracy >= 70"
                               [class.medium]="strategy.accuracy >= 50 && strategy.accuracy < 70"
                               [class.low]="strategy.accuracy < 50">
                          </div>
                          <span class="strategy-accuracy">{{ strategy.accuracy | number:'1.1-1' }}%</span>
                        </div>
                      </div>
                    }
                  </ion-card-content>
                </ion-card>
              }
            } @else {
              <div class="empty-state">
                <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                <h3>No Performance Data</h3>
                <p>Performance statistics will appear once predictions are evaluated.</p>
              </div>
            }
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--ion-color-medium);
    }

    .tab-content {
      padding: 8px;
    }

    /* Summary Bar */
    .summary-bar {
      display: flex;
      justify-content: space-around;
      padding: 16px 8px;
      margin-bottom: 8px;
      background: var(--ion-card-background, #fff);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Prediction Cards */
    .prediction-card {
      cursor: pointer;
      transition: transform 0.2s;
    }

    .prediction-card:active {
      transform: scale(0.98);
    }

    .match-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .teams {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .team {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .vs {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      font-weight: 400;
    }

    /* Probability Bar */
    .probabilities {
      margin: 8px 0;
    }

    .prob-bar {
      display: flex;
      height: 28px;
      border-radius: 14px;
      overflow: hidden;
      background: var(--ion-color-light);
    }

    .prob-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 600;
      color: #fff;
      min-width: 30px;
      transition: width 0.4s ease;
    }

    .prob-segment.home-win {
      background: var(--ion-color-primary);
    }

    .prob-segment.draw {
      background: var(--ion-color-warning);
    }

    .prob-segment.away-win {
      background: var(--ion-color-danger);
    }

    .prob-labels {
      display: flex;
      justify-content: space-between;
      padding: 4px 4px 0;
      font-size: 0.7rem;
      color: var(--ion-color-medium);
    }

    .prediction-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .prediction-footer ion-note {
      font-size: 0.8rem;
      flex: 1;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .stat-card ion-card-content {
      text-align: center;
      padding: 16px 8px;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--ion-color-dark);
    }

    .stat-value.accuracy {
      color: var(--ion-color-success);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    /* Strategy Breakdown */
    .strategy-row {
      padding: 12px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .strategy-row:last-child {
      border-bottom: none;
    }

    .strategy-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .strategy-name {
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: capitalize;
    }

    .strategy-count {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .strategy-bar-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .strategy-bar {
      height: 8px;
      border-radius: 4px;
      transition: width 0.4s ease;
      flex: 1;
      max-width: calc(100% - 50px);
    }

    .strategy-bar.high {
      background: var(--ion-color-success);
    }

    .strategy-bar.medium {
      background: var(--ion-color-warning);
    }

    .strategy-bar.low {
      background: var(--ion-color-danger);
    }

    .strategy-accuracy {
      font-weight: 600;
      font-size: 0.85rem;
      min-width: 42px;
      text-align: right;
    }

    .recent-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .recent-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr auto;
      gap: 8px;
      align-items: center;
      padding: 10px;
      border-radius: 10px;
      background: var(--ion-color-light);
      cursor: pointer;
    }

    .match-col {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .outcome-col {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .confidence-col {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: var(--ion-color-dark);
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
  `]
})
export class PredictionAnalyticsPage implements OnInit, OnDestroy, AfterViewInit {
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);

  @ViewChild('confidenceChart') confidenceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('outcomeChart') outcomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('strategyChart') strategyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;

  activeTab = 'upcoming';
  loading = true;
  statsLoading = false;

  predictions: PredictionResult[] = [];
  performanceStats: any = null;

  highConfidenceCount = 0;
  averageConfidence = 0;
  probabilitySamplesLoading = false;
  avgBttsYes = 0;
  avgOver25 = 0;

  private charts: Chart[] = [];

  ngOnInit() {
    this.loadPredictions();
  }

  ngAfterViewInit() {
    // Charts will be built after data loads
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  onTabChange(event: any) {
    this.activeTab = event.detail.value;
    if (this.activeTab === 'performance' && !this.performanceStats) {
      this.loadPerformanceStats();
    }
    // Wait for Angular to render the new tab content, then build charts
    setTimeout(() => {
      if (this.activeTab === 'upcoming' && this.predictions.length > 0) {
        this.buildUpcomingCharts();
      }
    }, 100);
  }

  doRefresh(event: any) {
    if (this.activeTab === 'upcoming') {
      this.loadPredictions(() => event.target.complete());
    } else {
      this.loadPerformanceStats(() => event.target.complete());
    }
  }

  loadPredictions(callback?: () => void) {
    this.loading = true;
    this.analyticsService.getUpcomingPredictions(20).subscribe({
      next: (data) => {
        this.predictions = data || [];
        this.calculateSummary();
        this.loadProbabilitySnapshots();
        this.loading = false;
        callback?.();
        setTimeout(() => this.buildUpcomingCharts(), 100);
      },
      error: () => {
        this.predictions = [];
        this.loading = false;
        callback?.();
      }
    });
  }

  loadPerformanceStats(callback?: () => void) {
    this.statsLoading = true;
    this.analyticsService.getPredictionStats(undefined, 200).subscribe({
      next: (data) => {
        this.performanceStats = data || {};
        this.statsLoading = false;
        callback?.();
        setTimeout(() => this.buildPerformanceCharts(), 100);
      },
      error: () => {
        this.performanceStats = null;
        this.statsLoading = false;
        callback?.();
      }
    });
  }

  private calculateSummary() {
    this.highConfidenceCount = this.predictions.filter(p => p.confidence === 'high').length;
    const confidenceMap: Record<string, number> = { low: 33, medium: 66, high: 90 };
    if (this.predictions.length > 0) {
      const total = this.predictions.reduce((sum, p) => sum + (confidenceMap[p.confidence] || 50), 0);
      this.averageConfidence = Math.round(total / this.predictions.length);
    }
  }

  private loadProbabilitySnapshots() {
    const sampleIds = this.predictions.slice(0, 6).map((p) => p.matchId);
    if (!sampleIds.length) {
      this.avgBttsYes = 0;
      this.avgOver25 = 0;
      return;
    }

    this.probabilitySamplesLoading = true;
    const requests = sampleIds.map((matchId) =>
      forkJoin({
        btts: this.analyticsService.getBttsPrediction(matchId).pipe(catchError(() => of(null))),
        overUnder: this.analyticsService.getOverUnderPrediction(matchId).pipe(catchError(() => of(null))),
      })
    );

    forkJoin(requests).subscribe({
      next: (rows: any[]) => {
        const bttsValues = rows
          .map((r) => this.asPercent(Number(r?.btts?.btts_yes_probability ?? 0)))
          .filter((v) => Number.isFinite(v));
        const overValues = rows
          .map((r) => this.asPercent(Number(r?.overUnder?.over_probability ?? 0)))
          .filter((v) => Number.isFinite(v));

        this.avgBttsYes = bttsValues.length
          ? bttsValues.reduce((acc, val) => acc + val, 0) / bttsValues.length
          : 0;
        this.avgOver25 = overValues.length
          ? overValues.reduce((acc, val) => acc + val, 0) / overValues.length
          : 0;
        this.probabilitySamplesLoading = false;
      },
      error: () => {
        this.probabilitySamplesLoading = false;
      },
    });
  }

  private buildUpcomingCharts() {
    this.destroyCharts();

    // Confidence Distribution (Doughnut)
    if (this.confidenceChartRef?.nativeElement) {
      const low = this.predictions.filter(p => p.confidence === 'low').length;
      const medium = this.predictions.filter(p => p.confidence === 'medium').length;
      const high = this.predictions.filter(p => p.confidence === 'high').length;

      const chart = new Chart(this.confidenceChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Low', 'Medium', 'High'],
          datasets: [{
            data: [low, medium, high],
            backgroundColor: ['#eb445a', '#ffc409', '#2dd36f'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
      this.charts.push(chart);
    }

    // Outcome Distribution (Bar)
    if (this.outcomeChartRef?.nativeElement) {
      const home = this.predictions.filter(p => p.mostLikely === 'home').length;
      const draw = this.predictions.filter(p => p.mostLikely === 'draw').length;
      const away = this.predictions.filter(p => p.mostLikely === 'away').length;

      const chart = new Chart(this.outcomeChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Home Win', 'Draw', 'Away Win'],
          datasets: [{
            label: 'Predicted Outcomes',
            data: [home, draw, away],
            backgroundColor: ['#3880ff', '#ffc409', '#eb445a'],
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, precision: 0 }
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  asPercent(value: number): number {
    if (value == null || Number.isNaN(value as any)) {
      return 0;
    }
    const normalized = value <= 1 ? value * 100 : value;
    return Math.max(0, Math.min(100, normalized));
  }

  private buildPerformanceCharts() {
    // Destroy old perf charts
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    if (!this.performanceStats) return;

    // Strategy Accuracy Chart (Horizontal Bar)
    if (this.strategyChartRef?.nativeElement && this.performanceStats.byStrategy?.length > 0) {
      const strategies = this.performanceStats.byStrategy;
      const chart = new Chart(this.strategyChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: strategies.map((s: any) => s.name || 'Unknown'),
          datasets: [{
            label: 'Accuracy %',
            data: strategies.map((s: any) => s.accuracy || 0),
            backgroundColor: strategies.map((s: any) =>
              (s.accuracy || 0) >= 70 ? '#2dd36f' :
              (s.accuracy || 0) >= 50 ? '#ffc409' : '#eb445a'
            ),
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v: any) => v + '%' }
            }
          }
        }
      });
      this.charts.push(chart);
    }

    // Accuracy Trend (Line)
    if (this.trendChartRef?.nativeElement && this.performanceStats.trend?.length > 0) {
      const trend = this.performanceStats.trend;
      const chart = new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: trend.map((t: any) => t.period || t.date || ''),
          datasets: [{
            label: 'Accuracy %',
            data: trend.map((t: any) => t.accuracy || 0),
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3880ff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: (v: any) => v + '%' }
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  getConfidenceColor(confidence: string): string {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'danger';
      default: return 'medium';
    }
  }

  getMostLikelyLabel(mostLikely: string): string {
    switch (mostLikely) {
      case 'home': return 'Home Win';
      case 'draw': return 'Draw';
      case 'away': return 'Away Win';
      default: return mostLikely;
    }
  }

  getMostLikelyPercent(pred: PredictionResult): number {
    return Math.max(
      this.asPercent(pred.homeWinProbability),
      this.asPercent(pred.drawProbability),
      this.asPercent(pred.awayWinProbability),
    );
  }

  goToMatch(matchId: number) {
    this.router.navigate(['/analytics/match', matchId]);
  }
}
