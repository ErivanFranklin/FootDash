import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  Chart,
  ChartConfiguration,
  registerables,
  ArcElement,
  DoughnutController,
  RadialLinearScale,
} from 'chart.js';
import { TeamAnalytics } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';
import { LoggerService } from '../../core/services/logger.service';
import { addIcons } from 'ionicons';
import {
  footballOutline,
  shieldOutline,
  homeOutline,
  airplaneOutline,
  trendingUpOutline,
  statsChartOutline,
} from 'ionicons/icons';

Chart.register(...registerables, ArcElement, DoughnutController, RadialLinearScale);

@Component({
  selector: 'app-analytics-charts',
  templateUrl: './analytics-charts.component.html',
  styleUrls: ['./analytics-charts.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    TranslocoModule,
  ],
})
export class AnalyticsChartsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() teamId!: number;
  @Input() analytics: TeamAnalytics | null = null;

  @ViewChild('seasonOverviewChart') seasonOverviewRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('goalsChart') goalsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scoringTrendChart') scoringTrendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('homeAwayChart') homeAwayRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('formGaugeChart') formGaugeRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('defensiveChart') defensiveRef!: ElementRef<HTMLCanvasElement>;

  loading = true;
  error: string | null = null;

  private charts: Chart[] = [];
  private analyticsService = inject(AnalyticsService);
  private translocoService = inject(TranslocoService);
  private logger = inject(LoggerService);

  constructor() {
    addIcons({
      footballOutline,
      shieldOutline,
      homeOutline,
      airplaneOutline,
      trendingUpOutline,
      statsChartOutline,
    });
  }

  ngOnInit() {
    if (this.analytics) {
      this.loading = false;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => this.createAllCharts());
    } else if (this.teamId) {
      this.loadAnalytics();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['analytics'] && changes['analytics'].currentValue) {
      this.loading = false;
      requestAnimationFrame(() => this.createAllCharts());
    } else if (changes['teamId'] && changes['teamId'].currentValue && !this.analytics) {
      this.loadAnalytics();
    }
  }

  ngOnDestroy() {
    if (this.chartCreationTimer) {
      clearTimeout(this.chartCreationTimer);
    }
    this.destroyAllCharts();
  }

  private loadAnalytics() {
    if (!this.teamId) return;

    this.loading = true;
    this.analyticsService.getTeamAnalytics(this.teamId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
        requestAnimationFrame(() => this.createAllCharts());
      },
      error: (err) => {
        this.error = 'Failed to load analytics';
        this.loading = false;
        this.logger.error('Analytics charts error:', err);
      },
    });
  }

  private destroyAllCharts() {
    this.charts.forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = [];
    
    // Clear canvas contexts to prevent "Canvas is already in use" errors
    this.clearCanvas(this.seasonOverviewRef);
    this.clearCanvas(this.goalsChartRef);
    this.clearCanvas(this.scoringTrendRef);
    this.clearCanvas(this.homeAwayRef);
    this.clearCanvas(this.formGaugeRef);
    this.clearCanvas(this.defensiveRef);
  }

  private clearCanvas(canvasRef: ElementRef<HTMLCanvasElement> | undefined) {
    if (canvasRef?.nativeElement) {
      const ctx = canvasRef.nativeElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.nativeElement.width, canvasRef.nativeElement.height);
        // Reset canvas size to force complete cleanup
        const { width, height } = canvasRef.nativeElement.getBoundingClientRect();
        canvasRef.nativeElement.width = width;
        canvasRef.nativeElement.height = height;
      }
    }
  }

  private getCanvasContext(canvasRef: ElementRef<HTMLCanvasElement> | undefined): CanvasRenderingContext2D | null {
    if (!canvasRef?.nativeElement) return null;

    const canvas = canvasRef.nativeElement;
    
    // Check if chart already exists for this canvas and destroy it
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    return canvas.getContext('2d');
  }

  private chartCreationTimer: any = null;

  private createAllCharts() {
    if (!this.analytics) return;

    // Cancel any pending chart creation
    if (this.chartCreationTimer) {
      clearTimeout(this.chartCreationTimer);
    }

    this.destroyAllCharts();

    // Use setTimeout to ensure canvas elements are fully reset after destroy
    this.chartCreationTimer = setTimeout(() => {
      this.createSeasonOverviewChart();
      this.createGoalsChart();
      this.createScoringTrendChart();
      this.createHomeAwayChart();
      this.createFormGaugeChart();
      this.createDefensiveChart();
      this.chartCreationTimer = null;
    }, 50);
  }

  private createSeasonOverviewChart() {
    if (!this.analytics) return;

    const ctx = this.getCanvasContext(this.seasonOverviewRef);
    if (!ctx) return;

    const { won, drawn, lost } = this.analytics.overallStats;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Draws', 'Losses'],
        datasets: [
          {
            data: [won, drawn, lost],
            backgroundColor: [
              'rgba(52, 199, 89, 0.9)',
              'rgba(255, 204, 0, 0.9)',
              'rgba(255, 59, 48, 0.9)',
            ],
            borderColor: [
              'rgba(52, 199, 89, 1)',
              'rgba(255, 204, 0, 1)',
              'rgba(255, 59, 48, 1)',
            ],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12,
                weight: 500,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const total = won + drawn + lost;
                const percentage = ((context.raw as number) / total * 100).toFixed(1);
                return ` ${context.label}: ${context.raw} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createGoalsChart() {
    if (!this.analytics) return;

    const ctx = this.getCanvasContext(this.goalsChartRef);
    if (!ctx) return;

    const { goalsFor, goalsAgainst } = this.analytics.overallStats;
    const homeGoals = this.analytics.homePerformance.goalsFor;
    const awayGoals = this.analytics.awayPerformance.goalsFor;
    const homeConc = this.analytics.homePerformance.goalsAgainst;
    const awayConc = this.analytics.awayPerformance.goalsAgainst;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['Home Scored', 'Away Scored', 'Home Conceded', 'Away Conceded'],
        datasets: [
          {
            label: 'Goals',
            data: [homeGoals, awayGoals, homeConc, awayConc],
            backgroundColor: [
              'rgba(52, 199, 89, 0.8)',
              'rgba(52, 199, 89, 0.5)',
              'rgba(255, 59, 48, 0.8)',
              'rgba(255, 59, 48, 0.5)',
            ],
            borderColor: [
              'rgba(52, 199, 89, 1)',
              'rgba(52, 199, 89, 1)',
              'rgba(255, 59, 48, 1)',
              'rgba(255, 59, 48, 1)',
            ],
            borderWidth: 2,
            borderRadius: 8,
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
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#888888',
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#888888',
              stepSize: 10,
            },
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createScoringTrendChart() {
    if (!this.analytics?.scoringTrend) return;

    const ctx = this.getCanvasContext(this.scoringTrendRef);
    if (!ctx) return;

    const { last5Matches, average } = this.analytics.scoringTrend;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 122, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 122, 255, 0.02)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: ['Match 5', 'Match 4', 'Match 3', 'Match 2', 'Last Match'],
        datasets: [
          {
            label: 'Goals Scored',
            data: last5Matches,
            borderColor: 'rgba(0, 122, 255, 1)',
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointBackgroundColor: 'rgba(0, 122, 255, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
          },
          {
            label: 'Average',
            data: Array(5).fill(average),
            borderColor: 'rgba(255, 149, 0, 0.8)',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#888888',
            },
          },
          y: {
            beginAtZero: true,
            max: Math.max(...last5Matches) + 2,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#888888',
              stepSize: 1,
            },
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createHomeAwayChart() {
    if (!this.analytics) return;

    const ctx = this.getCanvasContext(this.homeAwayRef);
    if (!ctx) return;

    const { homePerformance, awayPerformance } = this.analytics;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['Wins', 'Draws', 'Losses'],
        datasets: [
          {
            label: 'Home',
            data: [homePerformance.won, homePerformance.drawn, homePerformance.lost],
            backgroundColor: 'rgba(0, 122, 255, 0.8)',
            borderColor: 'rgba(0, 122, 255, 1)',
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: 'Away',
            data: [awayPerformance.won, awayPerformance.drawn, awayPerformance.lost],
            backgroundColor: 'rgba(175, 82, 222, 0.8)',
            borderColor: 'rgba(175, 82, 222, 1)',
            borderWidth: 2,
            borderRadius: 6,
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
              color: '#ffffff',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'rectRounded',
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#888888',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#888888',
              stepSize: 5,
            },
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createFormGaugeChart() {
    if (!this.analytics?.formRating) return;

    const ctx = this.getCanvasContext(this.formGaugeRef);
    if (!ctx) return;

    const formRating = +this.analytics.formRating;
    const remaining = 100 - formRating;

    // Determine color based on rating
    let ratingColor: string;
    if (formRating >= 70) {
      ratingColor = 'rgba(52, 199, 89, 0.9)';
    } else if (formRating >= 50) {
      ratingColor = 'rgba(255, 204, 0, 0.9)';
    } else {
      ratingColor = 'rgba(255, 59, 48, 0.9)';
    }

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Form Rating', 'Remaining'],
        datasets: [
          {
            data: [formRating, remaining],
            backgroundColor: [ratingColor, 'rgba(50, 50, 50, 0.5)'],
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createDefensiveChart() {
    if (!this.analytics) return;

    const ctx = this.getCanvasContext(this.defensiveRef);
    if (!ctx) return;

    const { homePerformance, awayPerformance, overallStats } = this.analytics;

    // Calculate metrics for radar chart
    const cleanSheetRate = Math.min(100, (1 - (overallStats.goalsAgainst / Math.max(1, overallStats.played))) * 50);
    const homeDefense = Math.min(100, 100 - (homePerformance.goalsAgainst / Math.max(1, homePerformance.played)) * 20);
    const awayDefense = Math.min(100, 100 - (awayPerformance.goalsAgainst / Math.max(1, awayPerformance.played)) * 20);
    const goalDiffScore = Math.min(100, Math.max(0, 50 + overallStats.goalDifference * 2));
    const winRate = overallStats.winPercentage;

    const config: ChartConfiguration<'radar'> = {
      type: 'radar',
      data: {
        labels: ['Clean Sheet Rate', 'Home Defense', 'Away Defense', 'Goal Difference', 'Win Rate'],
        datasets: [
          {
            label: 'Performance',
            data: [cleanSheetRate, homeDefense, awayDefense, goalDiffScore, winRate],
            backgroundColor: 'rgba(0, 122, 255, 0.3)',
            borderColor: 'rgba(0, 122, 255, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(0, 122, 255, 1)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
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
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.label}: ${(context.raw as number).toFixed(1)}`,
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              display: false,
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            pointLabels: {
              color: '#888888',
              font: {
                size: 11,
              },
            },
          },
        },
      },
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  getFormLabel(): string {
    if (!this.analytics) return '';
    const rating = +this.analytics.formRating;
    if (rating >= 80) return 'Excellent';
    if (rating >= 65) return 'Good';
    if (rating >= 50) return 'Average';
    if (rating >= 35) return 'Poor';
    return 'Very Poor';
  }

  getFormColor(): string {
    if (!this.analytics) return 'medium';
    const rating = +this.analytics.formRating;
    if (rating >= 70) return 'success';
    if (rating >= 50) return 'warning';
    return 'danger';
  }

  getTrendIcon(): string {
    if (!this.analytics?.scoringTrend) return 'remove-outline';
    switch (this.analytics.scoringTrend.trend) {
      case 'up':
        return 'trending-up-outline';
      case 'down':
        return 'trending-down-outline';
      default:
        return 'remove-outline';
    }
  }

  getTrendColor(): string {
    if (!this.analytics?.scoringTrend) return 'medium';
    switch (this.analytics.scoringTrend.trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      default:
        return 'medium';
    }
  }
}
