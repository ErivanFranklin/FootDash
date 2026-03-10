import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonNote,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { addIcons } from 'ionicons';
import {
  starOutline,
  star,
  swapHorizontalOutline,
  footballOutline,
} from 'ionicons/icons';

interface RosterPlayer {
  id: number;
  playerId: number;
  position: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  purchasePrice: number;
  isStarter: boolean;
}

interface FantasyTeam {
  id: number;
  name: string;
  budget: number;
  totalPoints: number;
  formation: string;
  freeTransfersRemaining: number;
  roster: RosterPlayer[];
}

@Component({
  selector: 'app-fantasy-team',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/fantasy/league/' + leagueId"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ team()?.name || 'My Team' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (team(); as t) {
        <!-- Team Summary -->
        <div class="team-summary ion-padding">
          <div class="summary-stat">
            <span class="stat-value">{{ t.totalPoints }}</span>
            <span class="stat-label">Points</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value">{{ t.budget | number: '1.1-1' }}M</span>
            <span class="stat-label">Budget</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value">{{ t.formation }}</span>
            <span class="stat-label">Formation</span>
          </div>
          <div class="summary-stat">
            <span class="stat-value">{{ t.freeTransfersRemaining }}</span>
            <span class="stat-label">Free Transfers</span>
          </div>
        </div>

        <!-- Pitch View -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="football-outline"></ion-icon>
              Starting XI
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="pitch">
              @for (pos of ['GK', 'DEF', 'MID', 'FWD']; track pos) {
                <div class="pitch-row">
                  <span class="position-label">{{ pos }}</span>
                  <div class="players-in-row">
                    @for (player of getPlayersInPosition(pos, true); track player.id) {
                      <div class="player-card" [class.captain]="player.isCaptain" [class.vice-captain]="player.isViceCaptain">
                        <div class="player-shirt">
                          <ion-icon name="shirt-outline"></ion-icon>
                          @if (player.isCaptain) {
                            <span class="captain-badge">C</span>
                          }
                          @if (player.isViceCaptain) {
                            <span class="captain-badge vc">V</span>
                          }
                        </div>
                        <span class="player-id">P#{{ player.playerId }}</span>
                        <span class="player-price">{{ player.purchasePrice | number: '1.1-1' }}M</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Bench -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Bench</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              @for (player of getBenchPlayers(); track player.id) {
                <ion-item>
                  <ion-chip slot="start" color="medium">{{ player.position }}</ion-chip>
                  <ion-label>
                    <h3>Player #{{ player.playerId }}</h3>
                    <p>{{ player.purchasePrice | number: '1.1-1' }}M</p>
                  </ion-label>
                </ion-item>
              }
              @if (getBenchPlayers().length === 0) {
                <ion-item>
                  <ion-label class="ion-text-center">
                    <p>No bench players</p>
                  </ion-label>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Actions -->
        <div class="ion-padding">
          <ion-button
            expand="block"
            [routerLink]="['/fantasy/league', leagueId, 'transfers']"
            [queryParams]="{ teamId: teamId }"
          >
            <ion-icon name="swap-horizontal-outline" slot="start"></ion-icon>
            Transfer Market
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .team-summary {
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      background: var(--ion-color-primary);
      color: white;
    }
    .summary-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-value {
      font-size: 1.3rem;
      font-weight: 700;
    }
    .stat-label {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-top: 0.2rem;
    }
    .pitch {
      background: linear-gradient(
        to bottom,
        #2d8b2d 0%, #3aa03a 12%, #2d8b2d 12%,
        #2d8b2d 25%, #3aa03a 37%, #2d8b2d 37%,
        #2d8b2d 50%, #3aa03a 62%, #2d8b2d 62%,
        #2d8b2d 75%, #3aa03a 87%, #2d8b2d 87%
      );
      border-radius: 8px;
      padding: 1rem 0.5rem;
    }
    .pitch-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .position-label {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .players-in-row {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .player-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.4rem;
      min-width: 3.5rem;
    }
    .player-card.captain {
      background: rgba(255, 215, 0, 0.2);
      border-radius: 8px;
    }
    .player-shirt {
      position: relative;
      font-size: 1.6rem;
      color: white;
    }
    .captain-badge {
      position: absolute;
      bottom: -2px;
      right: -6px;
      background: gold;
      color: black;
      font-size: 0.55rem;
      font-weight: 800;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .captain-badge.vc {
      background: silver;
    }
    .player-id {
      font-size: 0.7rem;
      color: white;
      margin-top: 0.15rem;
    }
    .player-price {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.7);
    }
  `],
})
export class FantasyTeamPage implements OnInit {
  team = signal<FantasyTeam | null>(null);
  leagueId!: number;
  teamId!: number;

  private apiUrl = `${environment.apiBaseUrl}/fantasy`;

  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    addIcons({ starOutline, star, swapHorizontalOutline, footballOutline });
  }

  ngOnInit(): void {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    this.loadTeam();
  }

  loadTeam(): void {
    this.http.get<FantasyTeam>(`${this.apiUrl}/teams/${this.teamId}`).subscribe({
      next: (data) => this.team.set(data),
    });
  }

  getPlayersInPosition(position: string, startersOnly: boolean): RosterPlayer[] {
    return (this.team()?.roster || []).filter(
      (p) => p.position === position && p.isStarter === startersOnly,
    );
  }

  getBenchPlayers(): RosterPlayer[] {
    return (this.team()?.roster || []).filter((p) => !p.isStarter);
  }
}
