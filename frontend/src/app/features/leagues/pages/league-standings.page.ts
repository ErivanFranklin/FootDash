import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface StandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string | null };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

@Component({
  selector: 'app-league-standings',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButtons,
    IonBackButton,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/leagues"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ leagueName() }} — Standings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Standings Table -->
      <div class="standings-table">
        <div class="row header">
          <span class="pos">#</span>
          <span class="team-name">Team</span>
          <span class="stat">P</span>
          <span class="stat">W</span>
          <span class="stat">D</span>
          <span class="stat">L</span>
          <span class="stat">GD</span>
          <span class="stat pts">Pts</span>
        </div>
        @for (entry of standings(); track entry.rank) {
          <div class="row" [class.top4]="entry.rank <= 4" [class.relegation]="entry.rank > standings().length - 3">
            <span class="pos">{{ entry.rank }}</span>
            <span class="team-name">
              @if (entry.team.logo) {
                <img [src]="entry.team.logo" [alt]="entry.team.name" class="team-logo" />
              }
              {{ entry.team.name }}
            </span>
            <span class="stat">{{ entry.all.played }}</span>
            <span class="stat">{{ entry.all.win }}</span>
            <span class="stat">{{ entry.all.draw }}</span>
            <span class="stat">{{ entry.all.lose }}</span>
            <span class="stat">{{ entry.goalsDiff > 0 ? '+' : '' }}{{ entry.goalsDiff }}</span>
            <span class="stat pts">{{ entry.points }}</span>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .standings-table {
      padding: 8px;
      font-size: 0.85rem;
    }
    .row {
      display: flex;
      align-items: center;
      padding: 8px 4px;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }
    .row.header {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }
    .row.top4 .pos { color: var(--ion-color-success); font-weight: 700; }
    .row.relegation .pos { color: var(--ion-color-danger); font-weight: 700; }
    .pos { width: 30px; text-align: center; }
    .team-name { flex: 1; display: flex; align-items: center; gap: 6px; }
    .team-logo { width: 20px; height: 20px; }
    .stat { width: 30px; text-align: center; }
    .pts { font-weight: 700; }
  `],
})
export class LeagueStandingsPage implements OnInit {
  standings = signal<StandingEntry[]>([]);
  leagueName = signal<string>('');
  private leagueId = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStandings();
    this.loadLeagueInfo();
  }

  private loadLeagueInfo() {
    this.http.get<any>(`${environment.apiBaseUrl}/leagues/${this.leagueId}`).subscribe({
      next: (league) => this.leagueName.set(league.name),
    });
  }

  private loadStandings() {
    this.http.get<StandingEntry[]>(`${environment.apiBaseUrl}/leagues/${this.leagueId}/standings`).subscribe({
      next: (data) => this.standings.set(data),
    });
  }

  refresh(event: any) {
    this.loadStandings();
    setTimeout(() => event.target.complete(), 500);
  }
}
