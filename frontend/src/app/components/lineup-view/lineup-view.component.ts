import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonChip, IonLabel, IonAvatar, IonText, IonIcon } from '@ionic/angular/standalone';

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string;
}

export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: {
    id: number;
    name: string;
    photo: string | null;
  };
}

@Component({
  selector: 'app-lineup-view',
  standalone: true,
  imports: [CommonModule, IonChip, IonLabel, IonAvatar, IonText, IonIcon],
  template: `
    @if (lineups && lineups.length >= 2) {
      <!-- Formation summary -->
      <div class="formations-header">
        <div class="formation-team">
          @if (lineups[0].team.logo) {
            <img [src]="lineups[0].team.logo" [alt]="lineups[0].team.name" class="team-mini-logo">
          }
          <span class="team-label">{{ lineups[0].team.name }}</span>
          <ion-chip color="primary">{{ lineups[0].formation }}</ion-chip>
        </div>
        <div class="formation-team">
          <ion-chip color="tertiary">{{ lineups[1].formation }}</ion-chip>
          <span class="team-label">{{ lineups[1].team.name }}</span>
          @if (lineups[1].team.logo) {
            <img [src]="lineups[1].team.logo" [alt]="lineups[1].team.name" class="team-mini-logo">
          }
        </div>
      </div>

      <!-- Starting XI side by side -->
      <div class="lineup-columns">
        @for (teamLineup of lineups; track teamLineup.team.id) {
          <div class="lineup-column" [class.away]="$index === 1">
            <div class="column-header">
              <h4>Starting XI</h4>
            </div>
            @for (player of teamLineup.startXI; track player.id) {
              <div class="player-row">
                <span class="player-number">{{ player.number }}</span>
                <span class="player-name">{{ player.name }}</span>
                <span class="player-pos" [class]="'pos-' + (player.pos || 'U')">{{ player.pos || '?' }}</span>
              </div>
            }

            <!-- Substitutes -->
            <div class="column-header subs-header">
              <h4>Substitutes</h4>
            </div>
            @for (player of teamLineup.substitutes; track player.id) {
              <div class="player-row sub">
                <span class="player-number">{{ player.number }}</span>
                <span class="player-name">{{ player.name }}</span>
                <span class="player-pos" [class]="'pos-' + (player.pos || 'U')">{{ player.pos || '?' }}</span>
              </div>
            }

            <!-- Coach -->
            @if (teamLineup.coach?.name) {
              <div class="coach-row">
                <ion-icon name="person-outline"></ion-icon>
                <span>Coach: {{ teamLineup.coach.name }}</span>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="empty-state">
        <ion-icon name="people-outline" style="font-size: 48px; color: var(--ion-color-medium);"></ion-icon>
        <p>Lineups not available yet</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .formations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--ion-color-step-50);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .formation-team {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .team-mini-logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    .team-label {
      font-weight: 600;
      font-size: 13px;
    }

    .lineup-columns {
      display: flex;
      gap: 8px;
    }

    .lineup-column {
      flex: 1;
      min-width: 0;
    }

    .column-header {
      padding: 8px 12px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border-radius: 6px 6px 0 0;

      h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
      }
    }

    .lineup-column.away .column-header {
      background: var(--ion-color-tertiary);
      color: var(--ion-color-tertiary-contrast);
    }

    .subs-header {
      margin-top: 12px;
      background: var(--ion-color-medium);
      color: var(--ion-color-medium-contrast);
    }

    .lineup-column.away .subs-header {
      background: var(--ion-color-medium);
    }

    .player-row {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border-bottom: 1px solid var(--ion-color-step-100);
      gap: 8px;

      &.sub {
        opacity: 0.8;
      }
    }

    .player-number {
      font-weight: 700;
      font-size: 13px;
      width: 24px;
      text-align: center;
      color: var(--ion-color-primary);
    }

    .player-name {
      flex: 1;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-pos {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--ion-color-light);
    }

    .pos-G { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .pos-D { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .pos-M { color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .pos-F { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

    .coach-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--ion-color-medium);
      border-top: 1px solid var(--ion-color-step-100);
      margin-top: 4px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
      color: var(--ion-color-medium);

      p {
        margin-top: 8px;
        font-size: 14px;
      }
    }
  `]
})
export class LineupViewComponent {
  @Input() lineups: TeamLineup[] = [];
}
