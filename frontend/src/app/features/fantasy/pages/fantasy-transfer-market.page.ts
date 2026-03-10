import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  ToastController,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline, trendingUpOutline, trendingDownOutline, removeOutline } from 'ionicons/icons';
import { environment } from '../../../../environments/environment';

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

interface RosterPlayer {
  id: number;
  playerId: number;
  position: Position;
  purchasePrice: number;
  isStarter: boolean;
}

interface FantasyTeam {
  id: number;
  budget: number;
  freeTransfersRemaining: number;
  roster: RosterPlayer[];
}

interface MarketOption {
  playerId: number;
  name: string;
  position: Position;
  teamName?: string;
  price: number;
  form: number;
  trend: 'up' | 'down' | 'flat';
}

interface MarketResponse {
  teamId: number;
  budget: number;
  freeTransfersRemaining: number;
  outgoingPlayerId?: number;
  outgoingPosition?: Position;
  options: MarketOption[];
}

@Component({
  selector: 'app-fantasy-transfer-market',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonBadge,
    IonIcon,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/fantasy/league/' + leagueId"></ion-back-button>
        </ion-buttons>
        <ion-title>Transfer Market</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Transfer Summary</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="summary-grid">
            <div>
              <p class="label">Budget</p>
              <p class="value">{{ team()?.budget ?? market()?.budget ?? 0 | number: '1.1-1' }}M</p>
            </div>
            <div>
              <p class="label">Free Transfers</p>
              <p class="value">{{ team()?.freeTransfersRemaining ?? market()?.freeTransfersRemaining ?? 0 }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Select Outgoing Player</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            @for (player of starterPlayers(); track player.id) {
              <ion-item>
                <ion-badge slot="start" color="medium">{{ player.position }}</ion-badge>
                <ion-label>
                  <h3>Player #{{ player.playerId }}</h3>
                  <p>Purchase: {{ player.purchasePrice | number: '1.1-1' }}M</p>
                </ion-label>
                <ion-button
                  slot="end"
                  size="small"
                  [fill]="selectedOutPlayerId() === player.playerId ? 'solid' : 'outline'"
                  (click)="selectOutgoing(player.playerId)"
                >
                  Out
                </ion-button>
              </ion-item>
            }
            @if (starterPlayers().length === 0) {
              <ion-item>
                <ion-label>
                  <p>No starters available. Build your squad first.</p>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Market Options</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          @if (!selectedOutPlayerId()) {
            <ion-text color="medium">
              <p>Select an outgoing player to load market options.</p>
            </ion-text>
          }

          <ion-list>
            @for (option of market()?.options || []; track option.playerId) {
              <ion-item>
                <ion-badge slot="start" color="primary">{{ option.position }}</ion-badge>
                <ion-label>
                  <h3>{{ option.name }}</h3>
                  <p>
                    {{ option.teamName || 'Club TBA' }} ·
                    Price: {{ option.price | number: '1.1-1' }}M
                    · Form: {{ option.form }}
                    · Trend:
                    <ion-icon [name]="trendIcon(option.trend)"></ion-icon>
                  </p>
                </ion-label>
                <ion-button
                  slot="end"
                  size="small"
                  (click)="executeTransfer(option)"
                  [disabled]="!selectedOutPlayerId() || submitting()"
                >
                  <ion-icon name="swap-horizontal-outline" slot="start"></ion-icon>
                  Buy
                </ion-button>
              </ion-item>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .label {
        margin: 0;
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        text-transform: uppercase;
      }

      .value {
        margin: 0.25rem 0 0;
        font-size: 1.25rem;
        font-weight: 700;
      }
    `,
  ],
})
export class FantasyTransferMarketPage implements OnInit {
  leagueId = 0;
  teamId = 0;

  team = signal<FantasyTeam | null>(null);
  market = signal<MarketResponse | null>(null);
  selectedOutPlayerId = signal<number | null>(null);
  submitting = signal(false);

  private readonly apiUrl = `${environment.apiBaseUrl}/fantasy`;

  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastController);

  constructor() {
    addIcons({
      swapHorizontalOutline,
      trendingUpOutline,
      trendingDownOutline,
      removeOutline,
    });
  }

  ngOnInit(): void {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.teamId = Number(this.route.snapshot.queryParamMap.get('teamId'));

    if (!this.teamId) {
      this.showToast('Missing team id. Open Transfer Market from your team page.', 'warning');
      return;
    }

    this.loadTeam();
  }

  starterPlayers(): RosterPlayer[] {
    return (this.team()?.roster || []).filter((p) => p.isStarter);
  }

  selectOutgoing(playerId: number): void {
    this.selectedOutPlayerId.set(playerId);
    this.loadMarket();
  }

  executeTransfer(option: MarketOption): void {
    const outPlayerId = this.selectedOutPlayerId();
    if (!outPlayerId) {
      this.showToast('Pick an outgoing player first.', 'warning');
      return;
    }

    this.submitting.set(true);
    this.http
      .post(`${this.apiUrl}/teams/${this.teamId}/transfer`, {
        outPlayerId,
        inPlayerId: option.playerId,
        inPrice: option.price,
      })
      .subscribe({
        next: async () => {
          this.submitting.set(false);
          this.selectedOutPlayerId.set(null);
          this.market.set(null);
          this.loadTeam();
          await this.showToast('Transfer completed successfully.', 'success');
        },
        error: async (err) => {
          this.submitting.set(false);
          await this.showToast(err?.error?.message || 'Transfer failed.', 'danger');
        },
      });
  }

  trendIcon(trend: 'up' | 'down' | 'flat'): string {
    if (trend === 'up') return 'trending-up-outline';
    if (trend === 'down') return 'trending-down-outline';
    return 'remove-outline';
  }

  private loadTeam(): void {
    this.http.get<FantasyTeam>(`${this.apiUrl}/teams/${this.teamId}`).subscribe({
      next: (team) => this.team.set(team),
      error: async () => {
        await this.showToast('Failed to load fantasy team.', 'danger');
      },
    });
  }

  private loadMarket(): void {
    const outPlayerId = this.selectedOutPlayerId();
    if (!outPlayerId) return;

    this.http
      .get<MarketResponse>(`${this.apiUrl}/teams/${this.teamId}/market`, {
        params: { outPlayerId: String(outPlayerId) },
      })
      .subscribe({
        next: (data) => this.market.set(data),
        error: async () => {
          await this.showToast('Failed to load transfer market.', 'danger');
        },
      });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1800, color });
    await toast.present();
  }
}
