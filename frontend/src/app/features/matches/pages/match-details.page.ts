import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { PageHeaderComponent } from '../../../shared/components';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { ApiService } from '../../../core/services/api.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { normalizeMatch, NormalizedMatch } from '../../../core/adapters/match-adapter';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-match-details',
  standalone: true,
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
  imports: [CommonModule, IonContent, IonBadge, IonSpinner, PageHeaderComponent, RouterModule],
})
export class MatchDetailsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private api = inject(ApiService);

  matchId!: number;
  private matchSubject = new BehaviorSubject<NormalizedMatch | null>(null);
  match$: Observable<NormalizedMatch | null> = this.matchSubject.asObservable();
  homeLogoLoaded = false;
  awayLogoLoaded = false;
  connectionStatus$!: Observable<'connecting' | 'connected' | 'disconnected' | 'error'>;

  private subscriptions = new Subscription();

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
    });
    this.subscriptions.add(apiSub);

    // 2. Subscribe to WebSocket for real-time updates
    // subscribeToMatch is idempotent — the service tracks subscribed match ids and will
    // emit the subscribe event when connected (also re-subscribes on reconnect).
    this.wsService.subscribeToMatch(this.matchId);
    const wsSub = this.wsService.onMatchUpdate().subscribe(matchUpdate => {
      const normalized = normalizeMatch(matchUpdate);
      if (normalized.homeLogo) this.homeLogoLoaded = false;
      if (normalized.awayLogo) this.awayLogoLoaded = false;
      this.matchSubject.next(normalized);
    });
    this.subscriptions.add(wsSub);
  }

  ngOnDestroy() {
    this.wsService.unsubscribefromMatch(this.matchId);
    this.subscriptions.unsubscribe();
  }

  onLogoLoaded(side: 'home' | 'away') {
    if (side === 'home') this.homeLogoLoaded = true;
    if (side === 'away') this.awayLogoLoaded = true;
  }
}
