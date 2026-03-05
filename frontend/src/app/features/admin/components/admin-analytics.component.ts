import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonChip,
  IonIcon,
  IonBadge,
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import {
  AdminService,
  GrowthMetrics,
  RegistrationDataPoint,
  ActiveUsersDataPoint,
  PredictionAccuracyItem,
} from '../../../core/services/admin.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonChip,
    IonIcon,
    IonBadge,
  ],
  styles: [
    `
      :host {
        display: block;
      }
      .analytics-container {
        padding: 0 16px 24px;
      }
      .period-selector {
        margin-bottom: 16px;
      }
      .growth-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 20px;
      }
      .growth-card {
        background: var(--ion-color-light);
        border-radius: 12px;
        padding: 14px 12px;
        text-align: center;
      }
      .growth-card .value {
        font-size: 26px;
        font-weight: 700;
        margin: 0;
      }
      .growth-card .label {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 4px 0 0;
      }
      .growth-card .change {
        font-size: 12px;
        font-weight: 600;
        margin-top: 4px;
      }
      .change.positive {
        color: var(--ion-color-success);
      }
      .change.negative {
        color: var(--ion-color-danger);
      }
      .change.neutral {
        color: var(--ion-color-medium);
      }
      .chart-section {
        margin-bottom: 24px;
      }
      .chart-section h4 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 600;
        color: var(--ion-text-color);
      }
      .chart-wrapper {
        background: var(--ion-color-light);
        border-radius: 12px;
        padding: 12px;
        position: relative;
        min-height: 220px;
      }
      canvas {
        width: 100% !important;
        max-height: 260px;
      }
      .loading-center {
        text-align: center;
        padding: 40px;
      }
      .accuracy-cards {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .accuracy-card {
        background: var(--ion-color-light);
        border-radius: 12px;
        padding: 14px 16px;
        flex: 1;
        min-width: 90px;
        text-align: center;
      }
      .accuracy-card .model-name {
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 700;
        color: var(--ion-color-medium);
        margin: 0 0 6px;
      }
      .accuracy-card .accuracy-value {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      .accuracy-card .accuracy-detail {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin: 2px 0 0;
      }
    `,
  ],
  template: `
    @if (loading) {
      <div class="loading-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    } @else {
      <div class="analytics-container">
        <!-- Period selector -->
        <ion-segment
          class="period-selector"
          [value]="period"
          (ionChange)="onPeriodChange($event.detail.value?.toString() || '30')"
        >
          <ion-segment-button value="7">
            <ion-label>7 days</ion-label>
          </ion-segment-button>
          <ion-segment-button value="30">
            <ion-label>30 days</ion-label>
          </ion-segment-button>
          <ion-segment-button value="90">
            <ion-label>90 days</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Growth cards -->
        @if (growth) {
          <div class="growth-grid">
            <div class="growth-card">
              <p class="value">{{ growth.totalUsers }}</p>
              <p class="label">Total Users</p>
            </div>
            <div class="growth-card">
              <p class="value">{{ growth.proRate }}%</p>
              <p class="label">Pro Conversion</p>
            </div>
            <div class="growth-card">
              <p class="value">{{ growth.newUsers30d }}</p>
              <p class="label">New (30d)</p>
              <p
                class="change"
                [class.positive]="growth.newUsersChange > 0"
                [class.negative]="growth.newUsersChange < 0"
                [class.neutral]="growth.newUsersChange === 0"
              >
                {{ growth.newUsersChange > 0 ? '+' : '' }}{{ growth.newUsersChange }}%
              </p>
            </div>
            <div class="growth-card">
              <p class="value">{{ growth.activeUsers30d }}</p>
              <p class="label">Active (30d)</p>
              <p
                class="change"
                [class.positive]="growth.activeUsersChange > 0"
                [class.negative]="growth.activeUsersChange < 0"
                [class.neutral]="growth.activeUsersChange === 0"
              >
                {{ growth.activeUsersChange > 0 ? '+' : '' }}{{ growth.activeUsersChange }}%
              </p>
            </div>
          </div>
        }

        <!-- Registrations chart -->
        <div class="chart-section">
          <h4>User Registrations</h4>
          <div class="chart-wrapper">
            <canvas #registrationsCanvas></canvas>
          </div>
        </div>

        <!-- Active users chart -->
        <div class="chart-section">
          <h4>Daily Active Users</h4>
          <div class="chart-wrapper">
            <canvas #activeUsersCanvas></canvas>
          </div>
        </div>

        <!-- Prediction accuracy -->
        @if (accuracy.length > 0) {
          <div class="chart-section">
            <h4>Prediction Model Accuracy</h4>
            <div class="accuracy-cards">
              @for (item of accuracy; track item.modelType) {
                <div class="accuracy-card">
                  <p class="model-name">{{ item.modelType }}</p>
                  <p
                    class="accuracy-value"
                    [style.color]="item.accuracy >= 60 ? 'var(--ion-color-success)' : item.accuracy >= 40 ? 'var(--ion-color-warning)' : 'var(--ion-color-danger)'"
                  >
                    {{ item.accuracy }}%
                  </p>
                  <p class="accuracy-detail">{{ item.correct }}/{{ item.total }}</p>
                </div>
              }
            </div>
            <div class="chart-wrapper">
              <canvas #accuracyCanvas></canvas>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly adminService = inject(AdminService);

  @ViewChild('registrationsCanvas') registrationsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activeUsersCanvas') activeUsersRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accuracyCanvas') accuracyRef!: ElementRef<HTMLCanvasElement>;

  loading = true;
  period = '30';
  growth: GrowthMetrics | null = null;
  registrations: RegistrationDataPoint[] = [];
  activeUsers: ActiveUsersDataPoint[] = [];
  accuracy: PredictionAccuracyItem[] = [];

  private regChart: Chart | null = null;
  private activeChart: Chart | null = null;
  private accChart: Chart | null = null;
  private viewReady = false;

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Charts might need rendering if data loaded before view was ready
    if (!this.loading) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.regChart?.destroy();
    this.activeChart?.destroy();
    this.accChart?.destroy();
  }

  onPeriodChange(value: string) {
    this.period = value;
    this.loadTimeSeries();
  }

  private loadAll() {
    this.loading = true;
    const days = Number(this.period);

    // Load all data in parallel
    let completed = 0;
    const total = 4;
    const checkDone = () => {
      completed++;
      if (completed >= total) {
        this.loading = false;
        setTimeout(() => this.renderCharts(), 50);
      }
    };

    this.adminService.getGrowthMetrics().subscribe({
      next: (data) => {
        this.growth = data;
        checkDone();
      },
      error: () => checkDone(),
    });

    this.adminService.getRegistrationTrend(days).subscribe({
      next: (data) => {
        this.registrations = data;
        checkDone();
      },
      error: () => checkDone(),
    });

    this.adminService.getActiveUsers(days).subscribe({
      next: (data) => {
        this.activeUsers = data;
        checkDone();
      },
      error: () => checkDone(),
    });

    this.adminService.getPredictionAccuracy().subscribe({
      next: (data) => {
        this.accuracy = data;
        checkDone();
      },
      error: () => checkDone(),
    });
  }

  private loadTimeSeries() {
    const days = Number(this.period);
    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= 2) {
        this.renderCharts();
      }
    };

    this.adminService.getRegistrationTrend(days).subscribe({
      next: (data) => {
        this.registrations = data;
        checkDone();
      },
      error: () => checkDone(),
    });

    this.adminService.getActiveUsers(days).subscribe({
      next: (data) => {
        this.activeUsers = data;
        checkDone();
      },
      error: () => checkDone(),
    });
  }

  private renderCharts() {
    if (!this.viewReady) return;
    this.renderRegistrationsChart();
    this.renderActiveUsersChart();
    this.renderAccuracyChart();
  }

  private renderRegistrationsChart() {
    if (!this.registrationsRef?.nativeElement) return;
    this.regChart?.destroy();

    const labels = this.registrations.map((d) => this.formatDateLabel(d.date));
    const data = this.registrations.map((d) => d.count);

    this.regChart = new Chart(this.registrationsRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Registrations',
            data,
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: data.length > 30 ? 0 : 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: {
            ticks: {
              maxTicksLimit: 7,
              font: { size: 10 },
            },
          },
        },
      },
    });
  }

  private renderActiveUsersChart() {
    if (!this.activeUsersRef?.nativeElement) return;
    this.activeChart?.destroy();

    const labels = this.activeUsers.map((d) => this.formatDateLabel(d.date));
    const data = this.activeUsers.map((d) => d.count);

    this.activeChart = new Chart(this.activeUsersRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data,
            backgroundColor: 'rgba(45, 211, 111, 0.6)',
            borderColor: '#2dd36f',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: {
            ticks: {
              maxTicksLimit: 7,
              font: { size: 10 },
            },
          },
        },
      },
    });
  }

  private renderAccuracyChart() {
    if (!this.accuracyRef?.nativeElement || this.accuracy.length === 0) return;
    this.accChart?.destroy();

    const labels = this.accuracy.map((a) => a.modelType.charAt(0).toUpperCase() + a.modelType.slice(1));
    const accuracyData = this.accuracy.map((a) => a.accuracy);
    const colors = this.accuracy.map((a) =>
      a.accuracy >= 60
        ? 'rgba(45, 211, 111, 0.7)'
        : a.accuracy >= 40
          ? 'rgba(255, 196, 9, 0.7)'
          : 'rgba(235, 68, 90, 0.7)',
    );

    this.accChart = new Chart(this.accuracyRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Accuracy %',
            data: accuracyData,
            backgroundColor: colors,
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
        },
      },
    });
  }

  private formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
