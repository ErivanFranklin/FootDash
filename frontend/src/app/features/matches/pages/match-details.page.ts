import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { IonBackButton, IonHeader, IonToolbar, IonButtons, IonTitle, IonMenuButton, IonSegment, IonSegmentButton, IonLabel, SegmentCustomEvent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent, IonBadge, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { LiveIndicatorComponent } from '../../../shared/components';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { LiveMatchService, MatchState } from '../../../core/services/live-match.service';
import { ApiService } from '../../../core/services/api.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { normalizeMatch, NormalizedMatch } from '../../../core/adapters/match-adapter';
import { TranslocoPipe } from '@jsverse/transloco';
import { PredictionVotingComponent } from '../../../components/prediction-voting/prediction-voting.component';
import { MatchChatComponent } from '../../../components/match-chat/match-chat.component';
import { LineupViewComponent, TeamLineup } from '../../../components/lineup-view/lineup-view.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-match-details',
  standalone: true,
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
  imports: [CommonModule, IonContent, IonBadge, IonSpinner, IonButton, IonSegment, IonSegmentButton, IonLabel, LiveIndicatorComponent, RouterModule, TranslocoPipe, PredictionVotingComponent, MatchChatComponent, LineupViewComponent, IonBackButton, IonHeader, IonToolbar, IonButtons, IonTitle, IonMenuButton],
})
export class MatchDetailsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private liveMatchService = inject(LiveMatchService);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  matchId!: number;
  selectedTab: 'info' | 'lineups' = 'info';
  lineups: TeamLineup[] = [];
  lineupsLoading = false;
  private matchSubject = new BehaviorSubject<NormalizedMatch | null>(null);
  match$: Observable<NormalizedMatch | null> = this.matchSubject.asObservable();
  matchState$!: Observable<MatchState>;
  homeLogoLoaded = false;
  awayLogoLoaded = false;
  connectionStatus$!: Observable<'connecting' | 'connected' | 'disconnected' | 'error'>;
  scoreUpdated = false;

  private subscriptions = new Subscription();
  private previousHomeScore: number | null = null;
  private previousAwayScore: number | null = null;

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));

    // expose connection status for the template
    this.connectionStatus$ = this.wsService.connectionStatus();

    // 1. Fetch initial match data and normalize
    const apiSub = this.api.getMatch(this.matchId).subscribe(initialMatch => {
      const normalized = normalizeMatch(initialMatch);
      this.homeLogoLoaded = !Boolean(normalized.homeLogo);
      this.awayLogoLoaded = !Boolean(normalized.awayLogo);
      this.matchSubject.next(normalized);
      
      // Initialize live match service with initial data
      this.liveMatchService.initializeMatchState(this.matchId, {
        homeScore: normalized.homeScore ?? null,
        awayScore: normalized.awayScore ?? null,
        status: normalized.status || 'UNKNOWN',
      });
      
      this.previousHomeScore = normalized.homeScore ?? null;
      this.previousAwayScore = normalized.awayScore ?? null;
    });
    this.subscriptions.add(apiSub);

    // 2. Subscribe to live match updates via LiveMatchService
    this.matchState$ = this.liveMatchService.subscribeToMatch(this.matchId);
    
    const liveStateSub = this.matchState$.subscribe(state => {
      // Detect score changes for animation
      if (this.previousHomeScore !== null && this.previousAwayScore !== null) {
        if (state.homeScore !== this.previousHomeScore || state.awayScore !== this.previousAwayScore) {
          this.triggerScoreAnimation();
        }
      }
      
      this.previousHomeScore = state.homeScore;
      this.previousAwayScore = state.awayScore;
      
      // Update match data with live state
      const currentMatch = this.matchSubject.value;
      if (currentMatch) {
        const updatedMatch = {
          ...currentMatch,
          homeScore: state.homeScore,
          awayScore: state.awayScore,
          status: state.status,
          minute: state.minute,
        };
        this.matchSubject.next(updatedMatch);
      }
    });
    this.subscriptions.add(liveStateSub);

    // 3. Also listen to raw WebSocket updates for full match data
    const wsSub = this.wsService.onMatchUpdate().subscribe(matchUpdate => {
      const normalized = normalizeMatch(matchUpdate);
      if (normalized.homeLogo) this.homeLogoLoaded = false;
      if (normalized.awayLogo) this.awayLogoLoaded = false;
      this.matchSubject.next(normalized);
    });
    this.subscriptions.add(wsSub);
  }

  ngOnDestroy() {
    this.liveMatchService.unsubscribeFromMatch(this.matchId);
    this.subscriptions.unsubscribe();
  }

  onLogoLoaded(side: 'home' | 'away') {
    if (side === 'home') this.homeLogoLoaded = true;
    if (side === 'away') this.awayLogoLoaded = true;
  }

  onTabChange(event: SegmentCustomEvent) {
    this.selectedTab = event.detail.value as 'info' | 'lineups';
    if (this.selectedTab === 'lineups' && this.lineups.length === 0 && !this.lineupsLoading) {
      this.loadLineups();
    }
  }

  private loadLineups() {
    this.lineupsLoading = true;
    this.http.get<TeamLineup[]>(`${environment.apiBaseUrl}/matches/${this.matchId}/lineups`).subscribe({
      next: (data) => {
        this.lineups = (Array.isArray(data) && data.length >= 2)
          ? data
          : this.buildDemoLineups();
        this.lineupsLoading = false;
      },
      error: (err) => {
        this.logger.error('Failed to load lineups', err);
        this.lineups = this.buildDemoLineups();
        this.lineupsLoading = false;
      },
    });
  }

  private buildDemoLineups(): TeamLineup[] {
    const match = this.matchSubject.value;
    const homeName = match?.homeName || 'Home Team';
    const awayName = match?.awayName || 'Away Team';

    const mkPlayers = (baseId: number) => ({
      startXI: [
        { id: baseId + 1, name: 'Goalkeeper', number: 1, pos: 'G' },
        { id: baseId + 2, name: 'Center Back', number: 4, pos: 'D' },
        { id: baseId + 3, name: 'Full Back', number: 2, pos: 'D' },
        { id: baseId + 4, name: 'Midfielder', number: 8, pos: 'M' },
        { id: baseId + 5, name: 'Playmaker', number: 10, pos: 'M' },
        { id: baseId + 6, name: 'Winger', number: 7, pos: 'F' },
      ],
      substitutes: [
        { id: baseId + 7, name: 'Sub One', number: 14, pos: 'M' },
        { id: baseId + 8, name: 'Sub Two', number: 18, pos: 'F' },
      ],
    });

    const homePlayers = mkPlayers(1000);
    const awayPlayers = mkPlayers(2000);

    return [
      {
        team: { id: 1, name: homeName, logo: match?.homeLogo || null },
        formation: '4-3-3',
        startXI: homePlayers.startXI,
        substitutes: homePlayers.substitutes,
        coach: { id: 11, name: 'Home Coach', photo: null },
      },
      {
        team: { id: 2, name: awayName, logo: match?.awayLogo || null },
        formation: '4-2-3-1',
        startXI: awayPlayers.startXI,
        substitutes: awayPlayers.substitutes,
        coach: { id: 22, name: 'Away Coach', photo: null },
      },
    ];
  }

  private triggerScoreAnimation() {
    this.scoreUpdated = true;
    setTimeout(() => {
      this.scoreUpdated = false;
    }, 600);
  }
}
