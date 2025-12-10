import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PredictionResult } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-prediction-card',
  templateUrl: './prediction-card.component.html',
  styleUrls: ['./prediction-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PredictionCardComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() matchId!: number;
  @Input() showDetails = true;
  @ViewChild('probabilityChart') probabilityChartRef!: ElementRef<HTMLCanvasElement>;

  prediction: PredictionResult | null = null;
  loading = true;
  error: string | null = null;
  chart: Chart | null = null;

  constructor(public analyticsService: AnalyticsService) {}

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
        this.prediction = data;
        this.loading = false;
        if (this.probabilityChartRef) {
          this.createChart();
        }
      },
      error: (err) => {
        this.error = 'Failed to load prediction';
        this.loading = false;
        console.error('Prediction error:', err);
      },
    });
  }

  generateNewPrediction() {
    this.loading = true;
    this.error = null;

    this.analyticsService.generatePrediction(this.matchId).subscribe({
      next: (data) => {
        this.prediction = data;
        this.loading = false;
        if (this.chart) {
          this.chart.destroy();
        }
        this.createChart();
      },
      error: (err) => {
        this.error = 'Failed to generate prediction';
        this.loading = false;
        console.error('Generation error:', err);
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
                const value = context.parsed;
                return `${label}: ${value.toFixed(1)}%`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  getMostLikelyOutcome(): { outcome: string; probability: number } | null {
    if (!this.prediction) return null;
    return this.analyticsService.getMostLikelyOutcome(this.prediction);
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
