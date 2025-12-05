import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { PageHeaderComponent } from '../../../shared/components';
import { WebSocketService } from '../../../core/services/web-socket.service';
import { ApiService } from '../../../core/services/api.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-match-details',
  standalone: true,
  templateUrl: './match-details.page.html',
  styleUrls: ['./match-details.page.scss'],
  imports: [CommonModule, IonContent, PageHeaderComponent],
})
export class MatchDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private api = inject(ApiService);

  matchId!: number;
  match$: Observable<any>;
  private matchSubscription: Subscription;

  ngOnInit() {
    this.matchId = Number(this.route.snapshot.paramMap.get('matchId'));
    this.wsService.subscribeToMatch(this.matchId);

    this.match$ = this.wsService.onMatchUpdate();

    this.matchSubscription = this.api.getMatch(this.matchId).subscribe(initialMatch => {
      // you can use this to populate the initial state before ws updates come in
    });
  }

  ngOnDestroy() {
    this.wsService.unsubscribefromMatch(this.matchId);
    if (this.matchSubscription) {
      this.matchSubscription.unsubscribe();
    }
  }
}
