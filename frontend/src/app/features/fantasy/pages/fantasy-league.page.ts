import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonIcon,
  IonAvatar,
  IonNote,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, shirtOutline } from 'ionicons/icons';

interface Standing {
  fantasyTeam: {
    id: number;
    name: string;
    userId: number;
    totalPoints: number;
    formation: string;
  };
  rank: number;
}

interface LeagueDetail {
  id: number;
  name: string;
  inviteCode: string;
  maxMembers: number;
  status: string;
  season: string;
}

@Component({
  selector: 'app-fantasy-league',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonIcon,
    IonAvatar,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/fantasy"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ league()?.name || 'Fantasy League' }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
          <ion-segment-button value="standings">Standings</ion-segment-button>
          <ion-segment-button value="gameweek">Gameweek</ion-segment-button>
          <ion-segment-button value="info">Info</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Standings Tab -->
      @if (activeTab === 'standings') {
        <ion-list>
          <ion-item class="standings-header">
            <ion-label>
              <div class="standings-row header-row">
                <span class="rank">#</span>
                <span class="team-name">Team</span>
                <span class="points">Pts</span>
              </div>
            </ion-label>
          </ion-item>
          @for (entry of standings(); track entry.fantasyTeam.id) {
            <ion-item [routerLink]="['/fantasy/league', leagueId, 'team', entry.fantasyTeam.id]">
              <ion-label>
                <div class="standings-row">
                  <span class="rank" [class.top-3]="entry.rank <= 3">{{ entry.rank }}</span>
                  <span class="team-name">
                    <ion-icon name="shirt-outline"></ion-icon>
                    {{ entry.fantasyTeam.name }}
                  </span>
                  <span class="points">{{ entry.fantasyTeam.totalPoints }}</span>
                </div>
              </ion-label>
            </ion-item>
          }
          @if (standings().length === 0) {
            <ion-item>
              <ion-label class="ion-text-center">
                <p>No teams yet. Be the first to join!</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }

      <!-- Gameweek Tab -->
      @if (activeTab === 'gameweek') {
        <div class="gameweek-nav ion-padding">
          <ion-button fill="clear" size="small" (click)="changeGameweek(-1)" [disabled]="currentGameweek <= 1">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </ion-button>
          <h3>Gameweek {{ currentGameweek }}</h3>
          <ion-button fill="clear" size="small" (click)="changeGameweek(1)">
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </ion-button>
        </div>
        <ion-list>
          @for (result of gameweekResults(); track result.fantasyTeamId) {
            <ion-item>
              <ion-label>
                <h3>{{ result.teamName }}</h3>
                <p>{{ result.totalPoints }} points</p>
              </ion-label>
              <ion-badge slot="end" color="primary">{{ result.totalPoints }}</ion-badge>
            </ion-item>
          }
          @if (gameweekResults().length === 0) {
            <ion-item>
              <ion-label class="ion-text-center">
                <p>No results for this gameweek yet.</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }

      <!-- Info Tab -->
      @if (activeTab === 'info') {
        <div class="ion-padding">
          @if (league(); as lg) {
            <ion-list>
              <ion-item>
                <ion-label>
                  <p>League Name</p>
                  <h2>{{ lg.name }}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Invite Code</p>
                  <h2 class="mono">{{ lg.inviteCode }}</h2>
                </ion-label>
                <ion-button fill="clear" slot="end" (click)="copyInviteCode()">Copy</ion-button>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Status</p>
                  <ion-badge [color]="lg.status === 'active' ? 'success' : 'medium'">{{ lg.status }}</ion-badge>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Max Members</p>
                  <h2>{{ lg.maxMembers }}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Season</p>
                  <h2>{{ lg.season }}</h2>
                </ion-label>
              </ion-item>
            </ion-list>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .standings-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .header-row {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
    }
    .rank {
      width: 2rem;
      text-align: center;
      font-weight: 700;
    }
    .rank.top-3 {
      color: var(--ion-color-warning);
    }
    .team-name {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .points {
      width: 3rem;
      text-align: right;
      font-weight: 700;
    }
    .gameweek-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .mono {
      font-family: monospace;
      letter-spacing: 0.15rem;
    }
  `],
})
export class FantasyLeaguePage implements OnInit {
  league = signal<LeagueDetail | null>(null);
  standings = signal<Standing[]>([]);
  gameweekResults = signal<any[]>([]);
  activeTab = 'standings';
  currentGameweek = 1;
  leagueId!: number;

  private apiUrl = `${environment.apiBaseUrl}/fantasy`;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    addIcons({ chevronBackOutline, chevronForwardOutline, shirtOutline });
  }

  ngOnInit(): void {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLeague();
    this.loadStandings();
  }

  onTabChange(): void {
    if (this.activeTab === 'gameweek') {
      this.loadGameweekResults();
    }
  }

  loadLeague(): void {
    this.http.get<LeagueDetail>(`${this.apiUrl}/leagues/${this.leagueId}`).subscribe({
      next: (data) => this.league.set(data),
    });
  }

  loadStandings(): void {
    this.http.get<Standing[]>(`${this.apiUrl}/leagues/${this.leagueId}/standings`).subscribe({
      next: (data) => this.standings.set(data),
    });
  }

  loadGameweekResults(): void {
    this.http.get<any[]>(`${this.apiUrl}/gameweeks/${this.currentGameweek}/results`).subscribe({
      next: (data) => this.gameweekResults.set(data),
      error: () => this.gameweekResults.set([]),
    });
  }

  changeGameweek(delta: number): void {
    this.currentGameweek += delta;
    this.loadGameweekResults();
  }

  copyInviteCode(): void {
    const code = this.league()?.inviteCode;
    if (code) {
      navigator.clipboard.writeText(code);
    }
  }
}
