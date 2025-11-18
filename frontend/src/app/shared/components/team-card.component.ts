import { Component, Input } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-card',
  standalone: true,
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ getTeamName() }}</ion-card-title>
        <ion-card-subtitle *ngIf="getTeamCode()">{{ getTeamCode() }}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <div class="team-info" *ngIf="showDetails">
          <div class="team-founded" *ngIf="team?.founded">
            <ion-icon name="calendar-outline"></ion-icon>
            Founded: {{ team.founded }}
          </div>
          <div class="team-venue" *ngIf="team?.venue">
            <ion-icon name="location-outline"></ion-icon>
            Venue: {{ team.venue }}
          </div>
          <div class="team-colors" *ngIf="team?.clubColors">
            <ion-icon name="color-palette-outline"></ion-icon>
            Colors: {{ team.clubColors }}
          </div>
        </div>

        <div class="team-actions" *ngIf="actions?.length">
          <ion-button
            *ngFor="let action of actions"
            [size]="action.size || 'small'"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled"
            (click)="action.handler(team)">
            <ng-container *ngIf="!action.loading; else loadingTemplate">
              <ion-icon *ngIf="action.icon" [name]="action.icon"></ion-icon>
              {{ action.label }}
            </ng-container>
            <ng-template #loadingTemplate>
              <ion-spinner name="dots"></ion-spinner>
            </ng-template>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .team-info {
      margin-bottom: var(--spacing-md);
    }

    .team-info > div {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
      font-size: var(--font-size-sm);
    }

    .team-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
      margin-top: var(--spacing-md);
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, CommonModule]
})
export class TeamCardComponent {
  @Input() team: any;
  @Input() showDetails: boolean = false;
  @Input() actions?: Array<{
    label: string;
    handler: (team: any) => void;
    icon?: string;
    color?: string;
    size?: string;
    disabled?: boolean;
    loading?: boolean;
  }>;

  getTeamName(): string {
    return this.team?.name ||
           this.team?.team?.name ||
           `Team #${this.team?.id ?? this.team?.teamId ?? 'Unknown'}`;
  }

  getTeamCode(): string | null {
    return this.team?.code || null;
  }
}