import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { PageHeaderComponent } from '../../../shared/components';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { ApiService } from '../../../core/services/api.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-match-details',
  standalone: true,
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
  imports: [CommonModule, IonContent, IonBadge, IonSpinner, PageHeaderComponent],
})
export class MatchDetailsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private api = inject(ApiService);

  matchId!: number;
  private matchSubject = new BehaviorSubject<any>(null);
  match$: Observable<any> = this.matchSubject.asObservable();
  connectionStatus$: Observable<'connecting' | 'connected' | 'disconnected' | 'error'>;

  private subscriptions = new Subscription();

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));

    // expose connection status for the template
    this.connectionStatus$ = this.wsService.connectionStatus();

    // 1. Fetch initial match data
    const apiSub = this.api.getMatch(this.matchId).subscribe(initialMatch => {
      this.matchSubject.next(initialMatch);
    });
    this.subscriptions.add(apiSub);

    // 2. Subscribe to WebSocket for real-time updates
    // subscribeToMatch is idempotent — the service tracks subscribed match ids and will
    // emit the subscribe event when connected (also re-subscribes on reconnect).
    this.wsService.subscribeToMatch(this.matchId);
    const wsSub = this.wsService.onMatchUpdate().subscribe(matchUpdate => {
      this.matchSubject.next(matchUpdate);
    });
    this.subscriptions.add(wsSub);
  }

  ngOnDestroy() {
    this.wsService.unsubscribefromMatch(this.matchId);
    this.subscriptions.unsubscribe();
  }
}
