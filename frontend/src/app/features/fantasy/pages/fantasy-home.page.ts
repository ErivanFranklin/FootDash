import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonInput,
  IonNote,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { addIcons } from 'ionicons';
import { addOutline, trophyOutline, peopleOutline, enterOutline } from 'ionicons/icons';

interface FantasyLeague {
  id: number;
  name: string;
  inviteCode: string;
  maxMembers: number;
  status: string;
  season: string;
  owner?: { displayName: string };
  teams?: any[];
}

@Component({
  selector: 'app-fantasy-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonFab,
    IonFabButton,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonInput,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Fantasy League</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="loadLeagues($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Empty State -->
      @if (leagues().length === 0 && !loading()) {
        <div class="empty-state">
          <ion-icon name="trophy-outline" class="empty-icon"></ion-icon>
          <h2>No Fantasy Leagues Yet</h2>
          <p>Create your own league or join one with an invite code.</p>
          <ion-button (click)="showCreateModal = true">
            <ion-icon name="add-outline" slot="start"></ion-icon>
            Create League
          </ion-button>
          <ion-button fill="outline" (click)="showJoinModal = true">
            <ion-icon name="enter-outline" slot="start"></ion-icon>
            Join League
          </ion-button>
        </div>
      }

      <!-- League Cards -->
      @for (league of leagues(); track league.id) {
        <ion-card [routerLink]="['/fantasy/league', league.id]">
          <ion-card-header>
            <ion-card-title>{{ league.name }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="league-meta">
              <div class="meta-item">
                <ion-icon name="people-outline"></ion-icon>
                <span>{{ league.teams?.length || 0 }} / {{ league.maxMembers }} members</span>
              </div>
              <div class="meta-item">
                <ion-badge [color]="league.status === 'active' ? 'success' : 'medium'">
                  {{ league.status }}
                </ion-badge>
              </div>
              <div class="meta-item">
                <span class="invite-code">Code: {{ league.inviteCode }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }

      <!-- FAB for quick actions -->
      @if (leagues().length > 0) {
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button (click)="showCreateModal = true">
            <ion-icon name="add-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }

      <!-- Create League Modal -->
      <ion-modal [isOpen]="showCreateModal" (didDismiss)="showCreateModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Create League</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showCreateModal = false">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item>
              <ion-input
                label="League Name"
                labelPlacement="stacked"
                placeholder="e.g. Premier Predictors"
                [(ngModel)]="newLeagueName"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-input
                label="Max Members"
                labelPlacement="stacked"
                type="number"
                placeholder="20"
                [(ngModel)]="newLeagueMaxMembers"
              ></ion-input>
            </ion-item>
            <ion-button
              expand="block"
              class="ion-margin-top"
              (click)="createLeague()"
              [disabled]="!newLeagueName"
            >
              Create League
            </ion-button>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Join League Modal -->
      <ion-modal [isOpen]="showJoinModal" (didDismiss)="showJoinModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Join League</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showJoinModal = false">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item>
              <ion-input
                label="Invite Code"
                labelPlacement="stacked"
                placeholder="Enter invite code"
                [(ngModel)]="joinCode"
              ></ion-input>
            </ion-item>
            @if (joinError()) {
              <ion-note color="danger" class="ion-padding">{{ joinError() }}</ion-note>
            }
            <ion-button
              expand="block"
              class="ion-margin-top"
              (click)="joinLeague()"
              [disabled]="!joinCode"
            >
              Join League
            </ion-button>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1rem;
      gap: 0.5rem;
    }
    .empty-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
    }
    .league-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
    }
    .invite-code {
      font-family: monospace;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
    }
  `],
})
export class FantasyHomePage implements OnInit {
  leagues = signal<FantasyLeague[]>([]);
  loading = signal(false);
  joinError = signal<string | null>(null);

  showCreateModal = false;
  showJoinModal = false;
  newLeagueName = '';
  newLeagueMaxMembers = 20;
  joinCode = '';

  private apiUrl = `${environment.apiBaseUrl}/fantasy`;

  constructor(private http: HttpClient) {
    addIcons({ addOutline, trophyOutline, peopleOutline, enterOutline });
  }

  ngOnInit(): void {
    this.loadLeagues();
  }

  loadLeagues(event?: any): void {
    this.loading.set(true);
    this.http.get<FantasyLeague[]>(`${this.apiUrl}/leagues`).subscribe({
      next: (data) => {
        this.leagues.set(data);
        this.loading.set(false);
        event?.target?.complete();
      },
      error: () => {
        this.loading.set(false);
        event?.target?.complete();
      },
    });
  }

  createLeague(): void {
    this.http
      .post<FantasyLeague>(`${this.apiUrl}/leagues`, {
        name: this.newLeagueName,
        maxMembers: this.newLeagueMaxMembers,
      })
      .subscribe({
        next: () => {
          this.showCreateModal = false;
          this.newLeagueName = '';
          this.loadLeagues();
        },
      });
  }

  joinLeague(): void {
    this.joinError.set(null);
    this.http
      .post<any>(`${this.apiUrl}/leagues/join`, { inviteCode: this.joinCode })
      .subscribe({
        next: () => {
          this.showJoinModal = false;
          this.joinCode = '';
          this.loadLeagues();
        },
        error: (err) => {
          this.joinError.set(err.error?.message || 'Failed to join league');
        },
      });
  }
}
