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
import { TeamAnalytics } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-team-analytics-card',
  templateUrl: './team-analytics-card.component.html',
  styleUrls: ['./team-analytics-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TeamAnalyticsCardComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() teamId!: number;
  @Input() showCharts = true;
  @ViewChild('formChart') formChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;

  analytics: TeamAnalytics | null = null;
  loading = true;
  error: string | null = null;
  formChart: Chart | null = null;
  performanceChart: Chart | null = null;

  constructor(public analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  ngAfterViewInit() {
    if (this.analytics && this.showCharts) {
      setTimeout(() => {
        this.createFormChart();
        this.createPerformanceChart();
      }, 100);
    }
  }

  ngOnDestroy() {
    if (this.formChart) {
      this.formChart.destroy();
    }
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }
  }

  loadAnalytics() {
    this.loading = true;
    this.error = null;

    this.analyticsService.getTeamAnalytics(this.teamId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
        if (this.showCharts) {
          this.createFormChart();
          this.createPerformanceChart();
        }
      },
      error: (err) => {
        this.error = 'Failed to load team analytics';
        this.loading = false;
        console.error('Analytics error:', err);
      },
    });
  }

  createFormChart() {
    if (!this.analytics || !this.formChartRef || !this.analytics.scoringTrend) {
      return;
    }

    const ctx = this.formChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5'],
        datasets: [
          {
            label: 'Goals Scored',
            data: this.analytics.scoringTrend.last5Matches,
            borderColor: 'rgba(52, 199, 89, 1)',
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Goals: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };

    this.formChart = new Chart(ctx, config);
  }

  createPerformanceChart() {
    if (!this.analytics || !this.performanceChartRef) {
      return;
    }

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Home', 'Away'],
        datasets: [
          {
            label: 'Wins',
            data: [
              this.analytics.homePerformance.won,
              this.analytics.awayPerformance.won,
            ],
            backgroundColor: 'rgba(52, 199, 89, 0.8)',
          },
          {
            label: 'Draws',
            data: [
              this.analytics.homePerformance.drawn,
              this.analytics.awayPerformance.drawn,
            ],
            backgroundColor: 'rgba(255, 204, 0, 0.8)',
          },
          {
            label: 'Losses',
            data: [
              this.analytics.homePerformance.lost,
              this.analytics.awayPerformance.lost,
            ],
            backgroundColor: 'rgba(255, 59, 48, 0.8)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    };

    this.performanceChart = new Chart(ctx, config);
  }

  getFormRatingColor(rating: number): string {
    if (rating >= 70) return 'success';
    if (rating >= 50) return 'warning';
    return 'danger';
  }

  getDefensiveRatingColor(rating: number): string {
    if (rating >= 70) return 'success';
    if (rating >= 50) return 'warning';
    return 'danger';
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'remove';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      case 'stable':
        return 'medium';
      default:
        return 'medium';
    }
  }
}
