import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
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

      <ion-card>
        <ion-card-header>
          <ion-card-title>Points Progression Snapshot</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="chart-wrap">
            <canvas #pointsChart></canvas>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Goals Scored vs Conceded</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="chart-wrap">
            <canvas #goalsChart></canvas>
          </div>
        </ion-card-content>
      </ion-card>

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
            <span class="stat">Form</span>
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
            <span class="stat form" [style.color]="getFormColor(entry)">{{ getFormIndex(entry) }}</span>
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
    .chart-wrap {
      height: 240px;
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
    .stat { width: 36px; text-align: center; }
    .form { font-weight: 700; }
    .pts { font-weight: 700; }
  `],
})
export class LeagueStandingsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pointsChart') pointsChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('goalsChart') goalsChartRef?: ElementRef<HTMLCanvasElement>;

  standings = signal<StandingEntry[]>([]);
  leagueName = signal<string>('');
  private leagueId = 0;
  private pointsChart: Chart | null = null;
  private goalsChart: Chart | null = null;
  private viewReady = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStandings();
    this.loadLeagueInfo();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy() {
    this.pointsChart?.destroy();
    this.goalsChart?.destroy();
  }

  private loadLeagueInfo() {
    this.http.get<any>(`${environment.apiBaseUrl}/leagues/${this.leagueId}`).subscribe({
      next: (league) => this.leagueName.set(league.name),
    });
  }

  private loadStandings() {
    this.http.get<StandingEntry[]>(`${environment.apiBaseUrl}/leagues/${this.leagueId}/standings`).subscribe({
      next: (data) => {
        this.standings.set(data);
        this.renderCharts();
      },
    });
  }

  private renderCharts() {
    if (!this.viewReady) return;
    const data = this.standings();
    if (!data.length) return;

    if (this.pointsChartRef?.nativeElement) {
      this.pointsChart?.destroy();
      const top = data.slice(0, 8);
      this.pointsChart = new Chart(this.pointsChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: top.map((e) => e.team.name),
          datasets: [{
            label: 'Points',
            data: top.map((e) => e.points),
            borderColor: '#3880ff',
            backgroundColor: 'rgba(56, 128, 255, 0.15)',
            fill: true,
            tension: 0.25,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { maxRotation: 50, minRotation: 50 } },
            y: { beginAtZero: true },
          },
        },
      });
    }

    if (this.goalsChartRef?.nativeElement) {
      this.goalsChart?.destroy();
      this.goalsChart = new Chart(this.goalsChartRef.nativeElement, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Teams',
            data: data.map((e) => ({
              x: e.all.goals.for,
              y: e.all.goals.against,
            })),
            pointRadius: 6,
            pointBackgroundColor: data.map((e) =>
              e.rank <= 4 ? '#2dd36f' : e.rank >= data.length - 2 ? '#eb445a' : '#3880ff'
            ),
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const team = data[ctx.dataIndex]?.team.name ?? 'Team';
                  return `${team}: GF ${ctx.parsed.x}, GA ${ctx.parsed.y}`;
                },
              },
            },
          },
          scales: {
            x: { title: { display: true, text: 'Goals For' } },
            y: { title: { display: true, text: 'Goals Against' } },
          },
        },
      });
    }
  }

  getFormIndex(entry: StandingEntry): string {
    const played = Math.max(1, entry.all.played);
    const form = ((entry.all.win * 3 + entry.all.draw) / (played * 3)) * 100;
    return `${Math.round(form)}`;
  }

  getFormColor(entry: StandingEntry): string {
    const form = Number(this.getFormIndex(entry));
    if (form >= 65) return 'var(--ion-color-success)';
    if (form >= 45) return 'var(--ion-color-warning)';
    return 'var(--ion-color-danger)';
  }

  refresh(event: any) {
    this.loadStandings();
    setTimeout(() => event.target.complete(), 500);
  }
}
