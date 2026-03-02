import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonButtons,
  IonBackButton,
  IonChip,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface League {
  id: number;
  externalId: number;
  name: string;
  country: string | null;
  logo: string | null;
  type: string | null;
  isFeatured: boolean;
}

@Component({
  selector: 'app-leagues',
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
    IonAvatar,
    IonBadge,
    IonButtons,
    IonBackButton,
    IonChip,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Leagues</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Featured Leagues -->
      @if (featuredLeagues().length) {
        <div class="section-header">Featured</div>
        <ion-list>
          @for (league of featuredLeagues(); track league.id) {
            <ion-item [routerLink]="['/leagues', league.id, 'standings']" detail>
              <ion-avatar slot="start">
                @if (league.logo) {
                  <img [src]="league.logo" [alt]="league.name" />
                } @else {
                  <div class="league-placeholder">{{ league.name.charAt(0) }}</div>
                }
              </ion-avatar>
              <ion-label>
                <h2>{{ league.name }}</h2>
                <p>{{ league.country ?? 'International' }}</p>
              </ion-label>
              <ion-chip slot="end" color="warning">
                <ion-label>{{ league.type ?? 'League' }}</ion-label>
              </ion-chip>
            </ion-item>
          }
        </ion-list>
      }

      <!-- Other Leagues -->
      @if (otherLeagues().length) {
        <div class="section-header">All Leagues</div>
        <ion-list>
          @for (league of otherLeagues(); track league.id) {
            <ion-item [routerLink]="['/leagues', league.id, 'standings']" detail>
              <ion-avatar slot="start">
                @if (league.logo) {
                  <img [src]="league.logo" [alt]="league.name" />
                } @else {
                  <div class="league-placeholder">{{ league.name.charAt(0) }}</div>
                }
              </ion-avatar>
              <ion-label>
                <h2>{{ league.name }}</h2>
                <p>{{ league.country ?? 'International' }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .section-header {
      padding: 16px 16px 8px;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--ion-color-medium);
    }
    .league-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: var(--ion-color-primary);
      color: #fff;
      font-weight: bold;
      font-size: 1.2rem;
      border-radius: 50%;
    }
  `],
})
export class LeaguesPage implements OnInit {
  featuredLeagues = signal<League[]>([]);
  otherLeagues = signal<League[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadLeagues();
  }

  loadLeagues() {
    this.http.get<League[]>(`${environment.apiBaseUrl}/leagues`).subscribe({
      next: (leagues) => {
        this.featuredLeagues.set(leagues.filter((l) => l.isFeatured));
        this.otherLeagues.set(leagues.filter((l) => !l.isFeatured));
      },
    });
  }

  refresh(event: any) {
    this.loadLeagues();
    setTimeout(() => event.target.complete(), 500);
  }
}
