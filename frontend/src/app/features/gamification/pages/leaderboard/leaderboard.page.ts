import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService, LeaderboardEntry } from '../../../../services/gamification.service';
import { PageHeaderComponent } from '../../../../shared/components';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslocoPipe, PageHeaderComponent],
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss']
})
export class LeaderboardPage implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  selectedPeriod: 'weekly' | 'monthly' | 'all-time' = 'weekly';
  isLoading = false;

  private gamificationService = inject(GamificationService);

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.gamificationService.getLeaderboard(this.selectedPeriod).subscribe({
      next: (data) => {
        this.leaderboard = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadLeaderboard();
  }
}
