import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService } from '../../services/gamification.service';

@Component({
  selector: 'app-prediction-voting',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslocoPipe],
  templateUrl: './prediction-voting.component.html',
  styleUrls: ['./prediction-voting.component.scss'],
})
export class PredictionVotingComponent {
  @Input() matchId!: number;
  @Input() homeTeamName: string = 'Home';
  @Input() awayTeamName: string = 'Away';

  homeScore: number | null = null;
  awayScore: number | null = null;
  hasVoted = false;

  private gamificationService = inject(GamificationService);

  submitVote() {
    if (this.homeScore === null || this.awayScore === null) return;
    
    this.gamificationService.submitPrediction(this.matchId, this.homeScore, this.awayScore)
      .subscribe({
        next: () => {
          this.hasVoted = true;
          // Ideally show a toast
        },
        error: (err) => console.error(err)
      });
  }
}
