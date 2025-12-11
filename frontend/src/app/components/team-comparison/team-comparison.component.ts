import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TeamComparison } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-team-comparison',
  templateUrl: './team-comparison.component.html',
  styleUrls: ['./team-comparison.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TeamComparisonComponent implements OnInit {
  @Input() homeTeamId!: number;
  @Input() awayTeamId!: number;

  comparison: TeamComparison | null = null;
  loading = true;
  error: string | null = null;

  private analyticsService = inject(AnalyticsService);

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
      },
      error: (err) => {
        this.error = 'Failed to load comparison';
        this.loading = false;
        console.error('Comparison error:', err);
      },
    });
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
    if (!this.comparison) return 'Unknown';
    
    switch (this.comparison.advantage) {
      case 'home':
        return `${this.comparison.homeTeam.teamName} Advantage`;
      case 'away':
        return `${this.comparison.awayTeam.teamName} Advantage`;
      case 'neutral':
        return 'Evenly Matched';
      default:
        return 'Unknown';
    }
  }

  getBarPercentage(homeValue: number, awayValue: number, isHome: boolean): number {
    const total = homeValue + awayValue;
    if (total === 0) return 50;
    
    const percentage = isHome ? (homeValue / total) * 100 : (awayValue / total) * 100;
    return Math.max(10, Math.min(90, percentage)); // Keep between 10-90 for visibility
  }
}
