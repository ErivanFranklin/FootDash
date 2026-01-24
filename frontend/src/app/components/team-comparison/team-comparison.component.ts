import { Component, Input, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TeamComparison } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-team-comparison',
  templateUrl: './team-comparison.component.html',
  styleUrls: ['./team-comparison.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslocoModule],
})
export class TeamComparisonComponent implements OnInit {
  @Input() homeTeamId!: number;
  @Input() awayTeamId!: number;
  @ViewChild('radarChart') radarChartRef?: ElementRef<HTMLCanvasElement>;

  comparison: TeamComparison | null = null;
  loading = true;
  error: string | null = null;
  chart: Chart | null = null;

  private analyticsService = inject(AnalyticsService);
  private translocoService = inject(TranslocoService);

  ngOnInit() {
    this.loadComparison();
  }

  loadComparison() {
    this.loading = true;
    this.error = null;

    this.analyticsService.compareTeams(this.homeTeamId, this.awayTeamId).subscribe({
      next: (data) => {
        this.comparison = data;
        this.loading = false;
        // Allow view to update then render chart
        setTimeout(() => this.createRadarChart(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load comparison';
        this.loading = false;
        console.error('Comparison error:', err);
      },
    });
  }

  createRadarChart() {
    if (!this.comparison || !this.radarChartRef) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.radarChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const t = (key: string) => this.translocoService.translate(`COMPARISON.${key}`);

    // Helper to calculate score (0-100)
    const calcAttack = (stats: any) => Math.min(100, (stats.goalsFor / Math.max(1, stats.played)) * 40); // 2.5 goals = 100
    const calcDefense = (rating: number) => Math.max(0, 100 - (rating * 30)); // 0 goals = 100, 3.33 goals = 0
    const calcPoints = (stats: any) => (stats.points / (stats.played * 3)) * 100;

    const data = {
      labels: [
        t('ATTACK'),
        t('DEFENSE'),
        t('FORM'),
        t('WIN_RATE'),
        t('POINTS')
      ],
      datasets: [
        {
          label: this.comparison.homeTeam.teamName,
          data: [
            calcAttack(this.comparison.homeTeam.overallStats),
            calcDefense(this.comparison.homeTeam.defensiveRating),
            this.comparison.homeTeam.formRating,
            this.comparison.homeTeam.overallStats.winPercentage,
            calcPoints(this.comparison.homeTeam.overallStats)
          ],
          fill: true,
          backgroundColor: 'rgba(52, 199, 89, 0.2)',
          borderColor: 'rgba(52, 199, 89, 1)',
          pointBackgroundColor: 'rgba(52, 199, 89, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(52, 199, 89, 1)'
        },
        {
          label: this.comparison.awayTeam.teamName,
          data: [
            calcAttack(this.comparison.awayTeam.overallStats),
            calcDefense(this.comparison.awayTeam.defensiveRating),
            this.comparison.awayTeam.formRating,
            this.comparison.awayTeam.overallStats.winPercentage,
            calcPoints(this.comparison.awayTeam.overallStats)
          ],
          fill: true,
          backgroundColor: 'rgba(255, 59, 48, 0.2)',
          borderColor: 'rgba(255, 59, 48, 1)',
          pointBackgroundColor: 'rgba(255, 59, 48, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 59, 48, 1)'
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'radar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--ion-text-color')
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              display: false,
              stepSize: 20
            },
            grid: {
              color: 'rgba(128, 128, 128, 0.2)'
            },
            pointLabels: {
              color: getComputedStyle(document.body).getPropertyValue('--ion-text-color'),
              font: {
                size: 11
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  getAdvantageColor(): string {
    if (!this.comparison) return 'medium';
    
    switch (this.comparison.advantage) {
      case 'home':
        return 'success';
      case 'away':
        return 'danger';
      case 'neutral':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getAdvantageText(): string {
    if (!this.comparison) return this.translocoService.translate('COMPARISON.NEUTRAL');
    
    switch (this.comparison.advantage) {
      case 'home':
        return this.translocoService.translate('COMPARISON.HOME_ADVANTAGE');
      case 'away':
        return this.translocoService.translate('COMPARISON.AWAY_ADVANTAGE');
      default:
        return this.translocoService.translate('COMPARISON.NEUTRAL');
    }
  }

  getBarPercentage(value1: number, value2: number, isFirst: boolean): number {
    const total = value1 + value2;
    if (total === 0) return 50;
    
    // Ensure minimum visible width (5%)
    const percentage = (isFirst ? value1 : value2) / total * 100;
    return Math.max(5, Math.min(95, percentage));
  }
}
