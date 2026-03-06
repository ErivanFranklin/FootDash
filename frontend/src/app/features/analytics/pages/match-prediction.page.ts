import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSpinner, IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonNote } from '@ionic/angular/standalone';
import { PredictionCardComponent } from '../../../components/prediction-card/prediction-card.component';
import { TeamComparisonComponent } from '../../../components/team-comparison/team-comparison.component';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoggerService } from '../../../core/services/logger.service';
import { TeamAnalyticsCardComponent } from '../../../components/team-analytics-card/team-analytics-card.component';
import { AnalyticsService } from '../../../services/analytics.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Match {
  id: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  kickOff?: Date;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

interface TimelineEvent {
  minute: number;
  label: string;
  type: 'home' | 'away' | 'neutral';
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
    IonNote,
    TranslocoPipe,
    PredictionCardComponent,
    TeamComparisonComponent,
    TeamAnalyticsCardComponent
  ],
})
export class MatchPredictionPage implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private analyticsService = inject(AnalyticsService);
  private logger = inject(LoggerService);

  @ViewChild('h2hChart') h2hChartRef?: ElementRef<HTMLCanvasElement>;

  matchId!: number;
  match$!: Observable<Match | null>;
  loading = true;
  probabilitiesLoading = true;
  h2hLoading = false;
  h2hMatches: Match[] = [];
  timeline: TimelineEvent[] = [];
  h2hHomeWins = 0;
  h2hAwayWins = 0;
  h2hDraws = 0;
  bttsYes = 0;
  bttsNo = 0;
  over25 = 0;
  under25 = 0;
  private h2hChart: Chart | null = null;
  private viewReady = false;

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.loadMatch();
    this.loadPredictionProbabilities();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderH2HChart();
  }

  ngOnDestroy(): void {
    this.h2hChart?.destroy();
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
        const mappedMatch = {
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
          homeScore: match.homeScore ?? null,
          awayScore: match.awayScore ?? null,
        } as Match;

        this.buildTimeline(mappedMatch);
        this.loadHeadToHead(mappedMatch.homeTeam.id, mappedMatch.awayTeam.id);

        return mappedMatch;
      }),
      catchError((error) => {
        this.logger.error('Error loading match:', error);
        this.loading = false;
        return of(null);
      })
    );
  }

  private loadHeadToHead(homeTeamId: number, awayTeamId: number) {
    if (!homeTeamId || !awayTeamId) {
      return;
    }

    this.h2hLoading = true;
    forkJoin({
      home: this.api.getTeamMatches(homeTeamId, { limit: 40 }),
      away: this.api.getTeamMatches(awayTeamId, { limit: 40 }),
    }).subscribe({
      next: ({ home, away }) => {
        const merged = [...(home || []), ...(away || [])] as any[];
        const uniqueById = new Map<number, any>();
        merged.forEach((match) => {
          if (match?.id) uniqueById.set(match.id, match);
        });

        const history = Array.from(uniqueById.values())
          .filter((match) => this.isHeadToHeadMatch(match, homeTeamId, awayTeamId))
          .filter((match) => Number(match.id) !== this.matchId)
          .filter((match) => match.homeScore != null && match.awayScore != null)
          .sort((a, b) => {
            const aTime = new Date(a.kickOff || 0).getTime();
            const bTime = new Date(b.kickOff || 0).getTime();
            return bTime - aTime;
          })
          .slice(0, 10)
          .map((match) => ({
            id: Number(match.id),
            homeTeam: {
              id: Number(match.homeTeam?.id || 0),
              name: String(match.homeTeam?.name || 'Home'),
            },
            awayTeam: {
              id: Number(match.awayTeam?.id || 0),
              name: String(match.awayTeam?.name || 'Away'),
            },
            kickOff: match.kickOff ? new Date(match.kickOff) : undefined,
            status: match.status,
            homeScore: Number(match.homeScore),
            awayScore: Number(match.awayScore),
          } as Match));

        this.h2hMatches = history;
        this.computeH2HSummary(homeTeamId, awayTeamId);
        this.h2hLoading = false;
        this.renderH2HChart();
      },
      error: (error) => {
        this.logger.warn('Failed to load H2H history', error);
        this.h2hLoading = false;
      },
    });
  }

  private computeH2HSummary(homeTeamId: number, awayTeamId: number) {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    this.h2hMatches.forEach((match) => {
      const homeScore = Number(match.homeScore ?? 0);
      const awayScore = Number(match.awayScore ?? 0);
      if (homeScore === awayScore) {
        draws += 1;
        return;
      }

      const winnerTeamId = homeScore > awayScore ? match.homeTeam.id : match.awayTeam.id;
      if (winnerTeamId === homeTeamId) {
        homeWins += 1;
      } else if (winnerTeamId === awayTeamId) {
        awayWins += 1;
      }
    });

    this.h2hHomeWins = homeWins;
    this.h2hAwayWins = awayWins;
    this.h2hDraws = draws;
  }

  private renderH2HChart() {
    if (!this.viewReady || !this.h2hChartRef?.nativeElement || this.h2hMatches.length === 0) {
      return;
    }

    this.h2hChart?.destroy();

    const chronological = [...this.h2hMatches].reverse();
    this.h2hChart = new Chart(this.h2hChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: chronological.map((match) => this.formatDate(match.kickOff)),
        datasets: [
          {
            label: 'Home goals',
            data: chronological.map((match) => Number(match.homeScore ?? 0)),
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.1)',
            fill: false,
            tension: 0.25,
          },
          {
            label: 'Away goals',
            data: chronological.map((match) => Number(match.awayScore ?? 0)),
            borderColor: '#eb445a',
            backgroundColor: 'rgba(235, 68, 90, 0.1)',
            fill: false,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }

  private buildTimeline(match: Match) {
    const timeline: TimelineEvent[] = [
      { minute: 0, label: 'Kickoff', type: 'neutral' },
      { minute: 45, label: 'Halftime', type: 'neutral' },
      { minute: 90, label: 'Full-time', type: 'neutral' },
    ];

    const homeGoals = Number(match.homeScore ?? 0);
    const awayGoals = Number(match.awayScore ?? 0);

    this.generateGoalMinutes(homeGoals, -2).forEach((minute) => {
      timeline.push({ minute, label: `${match.homeTeam.name} goal`, type: 'home' });
    });
    this.generateGoalMinutes(awayGoals, 2).forEach((minute) => {
      timeline.push({ minute, label: `${match.awayTeam.name} goal`, type: 'away' });
    });

    this.timeline = timeline.sort((a, b) => a.minute - b.minute);
  }

  private generateGoalMinutes(totalGoals: number, shift: number): number[] {
    if (!totalGoals || totalGoals < 1) {
      return [];
    }

    const start = 8;
    const end = 84;
    const span = end - start;
    const points: number[] = [];
    for (let i = 1; i <= totalGoals; i += 1) {
      const minute = Math.round(start + (span * i) / (totalGoals + 1) + shift);
      points.push(Math.max(1, Math.min(89, minute)));
    }
    return points;
  }

  private isHeadToHeadMatch(match: any, homeTeamId: number, awayTeamId: number): boolean {
    const left = Number(match?.homeTeam?.id || 0);
    const right = Number(match?.awayTeam?.id || 0);
    return (
      (left === homeTeamId && right === awayTeamId) ||
      (left === awayTeamId && right === homeTeamId)
    );
  }

  private formatDate(value?: Date): string {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
