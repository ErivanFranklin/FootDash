import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonLabel, IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService } from '../../services/gamification.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-prediction-voting',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonLabel, IonInput, IonButton, IonIcon, FormsModule, TranslocoPipe],
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
  private logger = inject(LoggerService);

  submitVote() {
    if (this.homeScore === null || this.awayScore === null) return;
    
    this.gamificationService.submitPrediction(this.matchId, this.homeScore, this.awayScore)
      .subscribe({
        next: () => {
          this.hasVoted = true;
          // Ideally show a toast
        },
        error: (err) => this.logger.error('Error submitting prediction vote', err)
      });
  }
}
