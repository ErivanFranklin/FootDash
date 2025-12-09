import { Component, Input } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { LiveIndicatorComponent } from './live-indicator.component';

@Component({
  selector: 'app-match-card',
  standalone: true,
  template: `
    <ion-card>
      <ion-card-header>
        <div class="card-header-content">
          <ion-card-title>
            {{ getHomeTeamName() }} vs {{ getAwayTeamName() }}
          </ion-card-title>
          <app-live-indicator 
            [status]="match?.status || ''" 
            [minute]="getMatchMinute()"
            class="live-badge">
          </app-live-indicator>
        </div>
      </ion-card-header>
      <ion-card-content>
        <!-- Score Display -->
        <div class="score-container" *ngIf="hasScore()">
          <div class="score-display">
            <span class="home-score">{{ getHomeScore() }}</span>
            <span class="score-separator">-</span>
            <span class="away-score">{{ getAwayScore() }}</span>
          </div>
          <div class="score-label" *ngIf="isHalfTime()">
            (HT: {{ getHalfTimeScore() }})
          </div>
        </div>

        <div class="match-info">
          <div class="match-date">
            <ion-icon name="calendar-outline"></ion-icon>
            {{ getMatchDate() | date:'medium' }}
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
    .card-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .card-header-content ion-card-title {
      flex: 1;
    }

    .live-badge {
      flex-shrink: 0;
    }

    .score-container {
      text-align: center;
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .score-display {
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    .score-separator {
      color: var(--ion-color-medium);
      font-weight: var(--font-weight-normal);
    }

    .score-label {
      font-size: var(--font-size-sm);
      color: var(--ion-color-medium);
      margin-top: var(--spacing-xs);
    }

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

    .match-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
      margin-top: var(--spacing-md);
    }

    @keyframes scoreUpdate {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); color: var(--ion-color-success); }
      100% { transform: scale(1); }
    }

    .score-display.updated {
      animation: scoreUpdate 0.6s ease-in-out;
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, CommonModule, DatePipe, LiveIndicatorComponent]
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

  hasScore(): boolean {
    return this.match?.homeScore !== null && 
           this.match?.homeScore !== undefined || 
           this.match?.awayScore !== null && 
           this.match?.awayScore !== undefined;
  }

  getHomeScore(): number | string {
    return this.match?.homeScore ?? this.match?.score?.fullTime?.home ?? '-';
  }

  getAwayScore(): number | string {
    return this.match?.awayScore ?? this.match?.score?.fullTime?.away ?? '-';
  }

  isHalfTime(): boolean {
    const status = (this.match?.status || '').toUpperCase();
    return status.includes('HALFTIME') || status.includes('HALF');
  }

  getHalfTimeScore(): string {
    const homeHT = this.match?.score?.halfTime?.home ?? '-';
    const awayHT = this.match?.score?.halfTime?.away ?? '-';
    return `${homeHT}-${awayHT}`;
  }

  getMatchMinute(): number | undefined {
    return this.match?.minute;
  }
}