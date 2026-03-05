import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonToggle,
  IonSearchbar,
  IonList,
  IonChip,
  IonSpinner,
  IonProgressBar,
  ToastController,
} from '@ionic/angular/standalone';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { FavoritesService } from '../../../services/favorites.service';

interface TeamOption {
  id: number;
  name: string;
  country?: string;
}

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonToggle,
    IonSearchbar,
    IonList,
    IonChip,
    IonSpinner,
    IonProgressBar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Welcome to FootDash</ion-title>
      </ion-toolbar>
      <ion-progress-bar [value]="(step + 1) / 4"></ion-progress-bar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (step === 0) {
        <h2>Pick Favorite Teams</h2>
        <p>Follow a few teams to personalize your dashboard and predictions.</p>

        <ion-searchbar
          [(ngModel)]="searchTerm"
          placeholder="Search teams"
          (ionInput)="searchTeams()"
        ></ion-searchbar>

        @if (loadingTeams) {
          <div class="center"><ion-spinner name="crescent"></ion-spinner></div>
        } @else {
          <ion-list>
            @for (team of teams; track team.id) {
              <ion-item button (click)="toggleTeam(team.id)">
                <ion-label>
                  <h3>{{ team.name }}</h3>
                  <p>{{ team.country || 'International' }}</p>
                </ion-label>
                <ion-chip [color]="selectedTeams.has(team.id) ? 'success' : 'medium'">
                  {{ selectedTeams.has(team.id) ? 'Selected' : 'Select' }}
                </ion-chip>
              </ion-item>
            }
          </ion-list>
        }
      }

      @if (step === 1) {
        <h2>Notification Preferences</h2>
        <p>Choose what matters most during matchdays.</p>
        <ion-item>
          <ion-label>Goal alerts</ion-label>
          <ion-toggle [(ngModel)]="notifications.goals"></ion-toggle>
        </ion-item>
        <ion-item>
          <ion-label>Kickoff reminders</ion-label>
          <ion-toggle [(ngModel)]="notifications.kickoff"></ion-toggle>
        </ion-item>
        <ion-item>
          <ion-label>Social activity</ion-label>
          <ion-toggle [(ngModel)]="notifications.social"></ion-toggle>
        </ion-item>
      }

      @if (step === 2) {
        <h2>Quick Tour</h2>
        <p>Use bottom tabs to jump quickly:</p>
        <ul>
          <li>Home: dashboard and recent matches</li>
          <li>Teams: discover and follow clubs</li>
          <li>Predict: analytics and prediction insights</li>
          <li>Feed: social activity and discussions</li>
        </ul>
      }

      @if (step === 3) {
        <h2>First Prediction Prompt</h2>
        <p>Start with analytics for upcoming fixtures and compare teams before your picks.</p>
      }

      <div class="actions">
        <ion-button fill="clear" (click)="prevStep()" [disabled]="step === 0">Back</ion-button>
        @if (step < 3) {
          <ion-button (click)="nextStep()">Next</ion-button>
        } @else {
          <ion-button color="success" (click)="finish()" [disabled]="saving">Finish</ion-button>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      h2 {
        margin-top: 8px;
      }
      .center {
        text-align: center;
        padding: 20px 0;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
    `,
  ],
})
export class OnboardingPage {
  private readonly http = inject(HttpClient);
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);

  private readonly ONBOARDING_KEY = 'footdash_onboarding_done';

  step = 0;
  searchTerm = '';
  loadingTeams = false;
  saving = false;

  teams: TeamOption[] = [];
  selectedTeams = new Set<number>();

  notifications = {
    goals: true,
    kickoff: true,
    social: true,
  };

  constructor() {
    this.searchTeams();
  }

  searchTeams() {
    this.loadingTeams = true;
    this.http
      .get<any>(`${environment.apiBaseUrl}/teams`, {
        params: {
          search: this.searchTerm || '',
          limit: '12',
          page: '1',
        },
      })
      .subscribe({
        next: (response) => {
          const rows = response?.data ?? response ?? [];
          this.teams = (rows || []).map((r: any) => ({
            id: Number(r.id),
            name: r.name,
            country: r.country,
          }));
          this.loadingTeams = false;
        },
        error: () => {
          this.loadingTeams = false;
          this.teams = [];
        },
      });
  }

  toggleTeam(teamId: number) {
    if (this.selectedTeams.has(teamId)) {
      this.selectedTeams.delete(teamId);
      return;
    }
    this.selectedTeams.add(teamId);
  }

  nextStep() {
    if (this.step < 3) this.step++;
  }

  prevStep() {
    if (this.step > 0) this.step--;
  }

  finish() {
    this.saving = true;
    const teamIds = [...this.selectedTeams];

    const requests = teamIds.map((id) =>
      this.favoritesService.addFavorite('team', id).pipe(catchError(() => of(null)))
    );

    const done = () => {
      localStorage.setItem(this.ONBOARDING_KEY, 'true');
      localStorage.setItem('footdash_notification_preferences', JSON.stringify(this.notifications));
      this.saving = false;
      this.toast.create({
        message: 'Onboarding complete. Your dashboard is ready.',
        duration: 2200,
        color: 'success',
      }).then((toast) => toast.present());
      this.router.navigate(['/home']);
    };

    if (!requests.length) {
      done();
      return;
    }

    forkJoin(requests).subscribe({
      next: () => done(),
      error: () => done(),
    });
  }
}
