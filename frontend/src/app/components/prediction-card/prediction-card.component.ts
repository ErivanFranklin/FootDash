import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonIcon, IonButton, IonBadge, IonProgressBar, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { addIcons } from 'ionicons';
import { alertCircleOutline, bulbOutline, refreshOutline } from 'ionicons/icons';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PredictionResult } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';
import { LoggerService } from '../../core/services/logger.service';

Chart.register(...registerables);

@Component({
  selector: 'app-prediction-card',
  templateUrl: './prediction-card.component.html',
  styleUrls: ['./prediction-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonIcon, IonButton, IonBadge, IonProgressBar, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol, TranslocoPipe],
})
export class PredictionCardComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() matchId!: number;
  @Input() showDetails = true;
  @ViewChild('probabilityChart') probabilityChartRef!: ElementRef<HTMLCanvasElement>;

  prediction: PredictionResult | null = null;
  loading = true;
  error: string | null = null;
  chart: Chart | null = null;

  private analyticsService = inject(AnalyticsService);
  private logger = inject(LoggerService);

  constructor() {
    addIcons({ refreshOutline, alertCircleOutline, bulbOutline });
  }

  ngOnInit() {
    this.loadPrediction();
  }

  ngAfterViewInit() {
    if (this.prediction && this.probabilityChartRef) {
      setTimeout(() => this.createChart(), 100);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadPrediction() {
    this.loading = true;
    this.error = null;

    this.analyticsService.getMatchPrediction(this.matchId).subscribe({
      next: (data) => {
        this.prediction = this.normalizePrediction(data);
        this.loading = false;
        if (this.probabilityChartRef) {
          this.createChart();
        }
      },
      error: (err) => {
        this.error = 'Failed to load prediction';
        this.loading = false;
        this.logger.error('Prediction error:', err);
      },
    });
  }

  generateNewPrediction() {
    this.loading = true;
    this.error = null;

    this.analyticsService.generatePrediction(this.matchId).subscribe({
      next: (data) => {
        this.prediction = this.normalizePrediction(data);
        this.loading = false;
        if (this.chart) {
          this.chart.destroy();
        }
        this.createChart();
      },
      error: (err) => {
        this.error = 'Failed to generate prediction';
        this.loading = false;
        this.logger.error('Generation error:', err);
      },
    });
  }

  createChart() {
    if (!this.prediction || !this.probabilityChartRef) {
      return;
    }

    const ctx = this.probabilityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: [
          `${this.prediction.homeTeam} Win`,
          'Draw',
          `${this.prediction.awayTeam} Win`,
        ],
        datasets: [
          {
            data: [
              this.prediction.homeWinProbability,
              this.prediction.drawProbability,
              this.prediction.awayWinProbability,
            ],
            backgroundColor: [
              'rgba(52, 199, 89, 0.8)',  // Green for home
              'rgba(255, 204, 0, 0.8)',  // Yellow for draw
              'rgba(255, 59, 48, 0.8)',  // Red for away
            ],
            borderColor: [
              'rgba(52, 199, 89, 1)',
              'rgba(255, 204, 0, 1)',
              'rgba(255, 59, 48, 1)',
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#000',
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.toNumber(context.parsed);
                return `${label}: ${value.toFixed(1)}%`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  getMostLikelyOutcome(): { type: 'home' | 'away' | 'draw'; probability: number } | null {
    if (!this.prediction) return null;
    const outcome = this.analyticsService.getMostLikelyOutcome(this.prediction);
    if (!outcome) return null;
    return {
      ...outcome,
      probability: this.toNumber(outcome.probability),
    };
  }

  formatPercent(value: unknown): string {
    return `${this.toNumber(value).toFixed(1)}%`;
  }

  progressValue(value: unknown): number {
    const n = this.toNumber(value);
    return Math.max(0, Math.min(1, n / 100));
  }

  formatWhole(value: unknown): string {
    return this.toNumber(value).toFixed(0);
  }

  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private normalizePrediction(data: PredictionResult): PredictionResult {
    const metadata = data?.metadata || {};
    return {
      ...data,
      homeWinProbability: this.toNumber(data?.homeWinProbability),
      drawProbability: this.toNumber(data?.drawProbability),
      awayWinProbability: this.toNumber(data?.awayWinProbability),
      confidence: data?.confidence,
      metadata: {
        ...metadata,
        homeFormRating: metadata.homeFormRating == null ? metadata.homeFormRating : this.toNumber(metadata.homeFormRating),
        awayFormRating: metadata.awayFormRating == null ? metadata.awayFormRating : this.toNumber(metadata.awayFormRating),
      },
    };
  }

  getConfidenceColor(): string {
    return this.prediction
      ? this.analyticsService.getConfidenceColor(this.prediction.confidence)
      : 'medium';
  }

  getConfidenceText(): string {
    return this.prediction
      ? this.analyticsService.getConfidenceText(this.prediction.confidence)
      : 'Unknown';
  }
}
