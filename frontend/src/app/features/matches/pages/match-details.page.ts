import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent, IonBadge, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { PageHeaderComponent, LiveIndicatorComponent } from '../../../shared/components';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { LiveMatchService, MatchState } from '../../../core/services/live-match.service';
import { ApiService } from '../../../core/services/api.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { normalizeMatch, NormalizedMatch } from '../../../core/adapters/match-adapter';
import { TranslocoPipe } from '@jsverse/transloco';
import { PredictionVotingComponent } from '../../../components/prediction-voting/prediction-voting.component';

@Component({
  selector: 'app-match-details',
  standalone: true,
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
  imports: [CommonModule, IonContent, IonBadge, IonSpinner, IonButton, PageHeaderComponent, LiveIndicatorComponent, RouterModule, TranslocoPipe, PredictionVotingComponent],
})
export class MatchDetailsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private liveMatchService = inject(LiveMatchService);
  private api = inject(ApiService);

  matchId!: number;
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

  private triggerScoreAnimation() {
    this.scoreUpdated = true;
    setTimeout(() => {
      this.scoreUpdated = false;
    }, 600);
  }
}
