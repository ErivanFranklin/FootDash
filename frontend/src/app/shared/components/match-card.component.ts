import { Component, Input, inject } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { LiveIndicatorComponent } from './live-indicator.component';
import { ShareService } from '../../core/services/share.service';

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
        
        <!-- Share button (always visible) -->
        <div class="match-share" *ngIf="showShare">
          <ion-button fill="clear" size="small" (click)="onShare()">
            <ion-icon slot="icon-only" name="share-social-outline"></ion-icon>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 8px 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    ion-card:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }

    .card-header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .card-header-content ion-card-title {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      word-break: break-word;
    }

    .live-badge {
      flex-shrink: 0;
    }

    .score-container {
      text-align: center;
      margin: 16px 0;
      padding: 16px 0;
      border-top: 1px solid var(--ion-color-light-shade);
      border-bottom: 1px solid var(--ion-color-light-shade);
    }

    .score-display {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      line-height: 1;
    }

    .home-score,
    .away-score {
      min-width: 48px;
      text-align: center;
    }

    .score-separator {
      color: var(--ion-color-medium);
      font-weight: 400;
      font-size: 1.8rem;
    }

    .score-label {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-top: 8px;
      font-weight: 500;
    }

    .match-info {
      margin: 12px 0;
    }

    .match-info > div {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--ion-color-step-600);
      line-height: 1.5;
    }

    .match-info ion-icon {
      font-size: 18px;
      flex-shrink: 0;
      color: var(--ion-color-medium);
    }

    .match-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .match-actions ion-button {
      flex: 1;
      min-width: 120px;
      --border-radius: 8px;
    }

    .match-share {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .match-share ion-button {
      --color: var(--ion-color-medium);
    }

    @keyframes scoreUpdate {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); color: var(--ion-color-success); }
      100% { transform: scale(1); }
    }

    .score-display.updated {
      animation: scoreUpdate 0.6s ease-in-out;
      will-change: transform; // GPU acceleration hint
    }

    /* Mobile optimizations */
    @media (max-width: 576px) {
      ion-card {
        margin: 8px 8px;
      }

      .card-header-content ion-card-title {
        font-size: 15px;
      }

      .score-display {
        font-size: 2.2rem;
        gap: 12px;
      }

      .match-info > div {
        font-size: 13px;
      }

      .match-actions ion-button {
        min-width: 100px;
        font-size: 13px;
      }
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, CommonModule, DatePipe, LiveIndicatorComponent]
})
export class MatchCardComponent {
  private shareService = inject(ShareService);
  
  @Input() match: any;
  @Input() showShare = true;
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

  onShare() {
    this.shareService.shareMatch(this.match);
  }
}