import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSpinner, IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { PredictionCardComponent } from '../../../components/prediction-card/prediction-card.component';
import { TeamComparisonComponent } from '../../../components/team-comparison/team-comparison.component';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoggerService } from '../../../core/services/logger.service';
import { TeamAnalyticsCardComponent } from '../../../components/team-analytics-card/team-analytics-card.component';
import { AnalyticsService } from '../../../services/analytics.service';

interface Match {
  id: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  kickOff?: Date;
  status?: string;
}

@Component({
  selector: 'app-match-prediction',
  standalone: true,
  templateUrl: './match-prediction.page.html',
  styleUrls: ['./match-prediction.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    TranslocoPipe,
    PredictionCardComponent,
    TeamComparisonComponent,
    TeamAnalyticsCardComponent
  ],
})
export class MatchPredictionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private analyticsService = inject(AnalyticsService);
  private logger = inject(LoggerService);

  matchId!: number;
  match$!: Observable<Match | null>;
  loading = true;
  probabilitiesLoading = true;
  bttsYes = 0;
  bttsNo = 0;
  over25 = 0;
  under25 = 0;

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadMatch();
    this.loadPredictionProbabilities();
  }

  private loadPredictionProbabilities() {
    this.probabilitiesLoading = true;
    forkJoin({
      btts: this.analyticsService.getBttsPrediction(this.matchId),
      overUnder: this.analyticsService.getOverUnderPrediction(this.matchId),
    }).subscribe({
      next: (payload: any) => {
        this.bttsYes = this.asPercent(payload?.btts?.btts_yes_probability ?? 0);
        this.bttsNo = this.asPercent(payload?.btts?.btts_no_probability ?? 0);
        this.over25 = this.asPercent(payload?.overUnder?.over_probability ?? 0);
        this.under25 = this.asPercent(payload?.overUnder?.under_probability ?? 0);
        this.probabilitiesLoading = false;
      },
      error: (error) => {
        this.logger.warn('Failed to load BTTS/Over-Under probabilities', error);
        this.probabilitiesLoading = false;
      },
    });
  }

  asPercent(value: number): number {
    const normalized = Number(value) <= 1 ? Number(value) * 100 : Number(value);
    return Math.max(0, Math.min(100, Number.isFinite(normalized) ? normalized : 0));
  }

  loadMatch() {
    this.match$ = this.api.getMatch(this.matchId).pipe(
      map((match: any) => {
        this.loading = false;
        return {
          id: match.id,
          homeTeam: { 
            id: match.homeTeam?.id || 0, 
            name: match.homeTeam?.name || 'Home Team' 
          },
          awayTeam: { 
            id: match.awayTeam?.id || 0, 
            name: match.awayTeam?.name || 'Away Team' 
          },
          kickOff: match.kickOff,
          status: match.status,
        };
      }),
      catchError((error) => {
        this.logger.error('Error loading match:', error);
        this.loading = false;
        return of(null);
      })
    );
  }
}
