import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSpinner, IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/angular/standalone';
import { PredictionCardComponent } from '../../../components/prediction-card/prediction-card.component';
import { TeamComparisonComponent } from '../../../components/team-comparison/team-comparison.component';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { TeamAnalyticsCardComponent } from '../../../components/team-analytics-card/team-analytics-card.component';

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
    TranslocoPipe,
    PredictionCardComponent,
    TeamComparisonComponent,
    TeamAnalyticsCardComponent
  ],
})
export class MatchPredictionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  matchId!: number;
  match$!: Observable<Match | null>;
  loading = true;

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadMatch();
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
        console.error('Error loading match:', error);
        this.loading = false;
        return of(null);
      })
    );
  }
}
