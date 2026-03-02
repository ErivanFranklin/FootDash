import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonIcon,
  IonNote,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { addIcons } from 'ionicons';
import { trendingUpOutline, flashOutline, statsChartOutline } from 'ionicons/icons';

interface OddsEntry {
  id: number;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  bookmaker: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number | null;
  under25: number | null;
  bttsYes: number | null;
  bttsNo: number | null;
}

interface ValueBet {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  market: string;
  bookmakerOdds: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  bookmaker: string;
  rating: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-odds',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonIcon,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Betting Odds</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
          <ion-segment-button value="odds">Match Odds</ion-segment-button>
          <ion-segment-button value="value">Value Bets</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Match Odds Tab -->
      @if (activeTab === 'odds') {
        @for (group of groupedOdds(); track group.matchId) {
          <ion-card>
            <ion-card-header>
              <ion-card-title class="match-title">
                {{ group.homeTeam }} vs {{ group.awayTeam }}
              </ion-card-title>
              <ion-note>{{ group.matchDate }}</ion-note>
            </ion-card-header>
            <ion-card-content>
              <div class="odds-table">
                <div class="odds-header-row">
                  <span class="bk-col">Bookmaker</span>
                  <span class="odds-col">1</span>
                  <span class="odds-col">X</span>
                  <span class="odds-col">2</span>
                  <span class="odds-col">O2.5</span>
                  <span class="odds-col">BTTS</span>
                </div>
                @for (entry of group.entries; track entry.id) {
                  <div class="odds-data-row">
                    <span class="bk-col">{{ entry.bookmaker }}</span>
                    <span class="odds-col" [class.best]="isBest(group.entries, 'homeWin', entry.homeWin)">{{ entry.homeWin | number: '1.2-2' }}</span>
                    <span class="odds-col" [class.best]="isBest(group.entries, 'draw', entry.draw)">{{ entry.draw | number: '1.2-2' }}</span>
                    <span class="odds-col" [class.best]="isBest(group.entries, 'awayWin', entry.awayWin)">{{ entry.awayWin | number: '1.2-2' }}</span>
                    <span class="odds-col">{{ entry.over25 ? (entry.over25 | number: '1.2-2') : '–' }}</span>
                    <span class="odds-col">{{ entry.bttsYes ? (entry.bttsYes | number: '1.2-2') : '–' }}</span>
                  </div>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }
        @if (groupedOdds().length === 0 && !loading()) {
          <div class="empty-state">
            <ion-icon name="stats-chart-outline" class="empty-icon"></ion-icon>
            <h2>No Odds Available</h2>
            <p>Odds will be synced automatically for upcoming matches.</p>
          </div>
        }
      }

      <!-- Value Bets Tab -->
      @if (activeTab === 'value') {
        @if (valueBets().length > 0) {
          <ion-list>
            @for (bet of valueBets(); track bet.matchId + bet.market + bet.bookmaker) {
              <ion-card>
                <ion-card-header>
                  <div class="value-header">
                    <ion-card-title class="match-title">
                      {{ bet.homeTeam }} vs {{ bet.awayTeam }}
                    </ion-card-title>
                    <ion-chip [color]="bet.rating === 'high' ? 'success' : bet.rating === 'medium' ? 'warning' : 'medium'">
                      <ion-icon name="flash-outline"></ion-icon>
                      {{ bet.rating | uppercase }}
                    </ion-chip>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <div class="value-grid">
                    <div class="value-item">
                      <span class="value-label">Market</span>
                      <span class="value-data">{{ bet.market }}</span>
                    </div>
                    <div class="value-item">
                      <span class="value-label">Bookmaker</span>
                      <span class="value-data">{{ bet.bookmaker }}</span>
                    </div>
                    <div class="value-item">
                      <span class="value-label">Odds</span>
                      <span class="value-data">{{ bet.bookmakerOdds | number: '1.2-2' }}</span>
                    </div>
                    <div class="value-item edge">
                      <span class="value-label">Edge</span>
                      <span class="value-data edge-value">
                        <ion-icon name="trending-up-outline"></ion-icon>
                        +{{ bet.edge | number: '1.1-1' }}%
                      </span>
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </ion-list>
        } @else if (!loading()) {
          <div class="empty-state">
            <ion-icon name="trending-up-outline" class="empty-icon"></ion-icon>
            <h2>No Value Bets Found</h2>
            <p>Value bets appear when our model detects edges over 5% vs bookmaker odds.</p>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [`
    .match-title {
      font-size: 1rem;
    }
    .odds-table {
      overflow-x: auto;
    }
    .odds-header-row, .odds-data-row {
      display: flex;
      align-items: center;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    .odds-header-row {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
    .bk-col {
      flex: 2;
      min-width: 80px;
      font-size: 0.85rem;
    }
    .odds-col {
      flex: 1;
      text-align: center;
      font-size: 0.85rem;
      min-width: 40px;
    }
    .odds-col.best {
      color: var(--ion-color-success);
      font-weight: 700;
    }
    .value-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .value-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .value-item {
      display: flex;
      flex-direction: column;
    }
    .value-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }
    .value-data {
      font-size: 0.95rem;
      font-weight: 600;
    }
    .edge-value {
      color: var(--ion-color-success);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
    }
  `],
})
export class OddsPage implements OnInit {
  odds = signal<OddsEntry[]>([]);
  valueBets = signal<ValueBet[]>([]);
  groupedOdds = signal<{ matchId: number; homeTeam: string; awayTeam: string; matchDate: string; entries: OddsEntry[] }[]>([]);
  loading = signal(false);
  activeTab = 'odds';

  private apiUrl = `${environment.apiBaseUrl}/odds`;

  constructor(private http: HttpClient) {
    addIcons({ trendingUpOutline, flashOutline, statsChartOutline });
  }

  ngOnInit(): void {
    this.loadOdds();
  }

  onTabChange(): void {
    if (this.activeTab === 'value' && this.valueBets().length === 0) {
      this.loadValueBets();
    }
  }

  loadOdds(): void {
    this.loading.set(true);
    this.http.get<OddsEntry[]>(`${this.apiUrl}`).subscribe({
      next: (data) => {
        this.odds.set(data);
        this.groupOdds(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadValueBets(): void {
    this.loading.set(true);
    this.http.get<ValueBet[]>(`${this.apiUrl}/value-bets`).subscribe({
      next: (data) => {
        this.valueBets.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  refresh(event: any): void {
    if (this.activeTab === 'odds') {
      this.loadOdds();
    } else {
      this.loadValueBets();
    }
    event.target.complete();
  }

  isBest(entries: OddsEntry[], field: keyof OddsEntry, value: number): boolean {
    if (entries.length <= 1) return false;
    const max = Math.max(...entries.map((e) => Number(e[field]) || 0));
    return Number(value) === max && max > 0;
  }

  private groupOdds(data: OddsEntry[]): void {
    const map = new Map<number, typeof this.groupedOdds extends ReturnType<typeof signal<(infer T)[]>> ? T : never>();
    for (const entry of data) {
      if (!map.has(entry.matchId)) {
        map.set(entry.matchId, {
          matchId: entry.matchId,
          homeTeam: entry.homeTeam,
          awayTeam: entry.awayTeam,
          matchDate: entry.matchDate,
          entries: [],
        });
      }
      map.get(entry.matchId)!.entries.push(entry);
    }
    this.groupedOdds.set(Array.from(map.values()));
  }
}
