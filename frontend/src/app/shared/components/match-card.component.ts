import { Component, Input } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-match-card',
  standalone: true,
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>
          {{ getHomeTeamName() }} vs {{ getAwayTeamName() }}
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="match-info">
          <div class="match-date">
            <ion-icon name="calendar-outline"></ion-icon>
            {{ getMatchDate() | date:'medium' }}
          </div>
          <div class="match-status" [class]="'status-' + (match?.status || 'unknown').toLowerCase()">
            Status: {{ match?.status || 'Unknown' }}
          </div>
          <div class="match-league" *ngIf="getLeagueName()">
            <ion-icon name="trophy-outline"></ion-icon>
            {{ getLeagueName() }}
          </div>
          <div class="match-venue" *ngIf="getVenueName()">
            <ion-icon name="location-outline"></ion-icon>
            {{ getVenueName() }}
          </div>
          <div class="match-referee" *ngIf="match?.referee">
            <ion-icon name="person-outline"></ion-icon>
            Referee: {{ match.referee }}
          </div>
        </div>

        <div class="match-actions" *ngIf="actions?.length">
          <ion-button
            *ngFor="let action of actions"
            [size]="action.size || 'small'"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled"
            (click)="action.handler(match)">
            <ion-icon *ngIf="action.icon" [name]="action.icon"></ion-icon>
            {{ action.label }}
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .match-info {
      margin-bottom: var(--spacing-md);
    }

    .match-info > div {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
      font-size: var(--font-size-sm);
    }

    .match-status {
      font-weight: var(--font-weight-medium);
    }

    .status-scheduled { color: var(--ion-color-primary); }
    .status-live { color: var(--ion-color-success); }
    .status-finished { color: var(--ion-color-medium); }
    .status-postponed { color: var(--ion-color-warning); }
    .status-cancelled { color: var(--ion-color-danger); }

    .match-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
      margin-top: var(--spacing-md);
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, CommonModule, DatePipe]
})
export class MatchCardComponent {
  @Input() match: any;
  @Input() actions?: Array<{
    label: string;
    handler: (match: any) => void;
    icon?: string;
    color?: string;
    size?: string;
    disabled?: boolean;
  }>;

  getHomeTeamName(): string {
    return this.match?.homeTeam?.name ||
           this.match?.home?.name ||
           this.match?.homeTeamName ||
           'Unknown Team';
  }

  getAwayTeamName(): string {
    return this.match?.awayTeam?.name ||
           this.match?.away?.name ||
           this.match?.awayTeamName ||
           'Unknown Team';
  }

  getMatchDate(): Date | null {
    const date = this.match?.kickOff || this.match?.date || this.match?.fixtureDate;
    return date ? new Date(date) : null;
  }

  getLeagueName(): string | null {
    return this.match?.league?.name || null;
  }

  getVenueName(): string | null {
    return this.match?.venue?.name || null;
  }
}