import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { BadgeResponse } from '../../../services/gamification.service';

@Component({
  selector: 'app-badge-card',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="badge-card" [class.locked]="!badge.unlocked" [class]="'tier-' + badge.tier">
      <div class="badge-icon">
        <ion-icon [name]="getIconName()" [style.font-size]="'32px'"></ion-icon>
      </div>
      <div class="badge-name">{{ badge.name }}</div>
      <div class="badge-tier">{{ badge.tier | uppercase }}</div>
      @if (!badge.unlocked && badge.progress !== undefined) {
        <div class="badge-progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="badge.progress"></div>
          </div>
          <span class="progress-text">{{ badge.progress }}%</span>
        </div>
      }
      @if (badge.unlocked && badge.unlockedAt) {
        <div class="badge-date">{{ badge.unlockedAt | date:'shortDate' }}</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .badge-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      border-radius: 12px;
      background: var(--ion-color-light);
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid transparent;
    }

    .badge-card:not(.locked):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .badge-card.locked {
      opacity: 0.5;
      filter: grayscale(0.6);
    }

    .badge-card.tier-bronze {
      border-color: #cd7f32;
    }

    .badge-card.tier-silver {
      border-color: #c0c0c0;
    }

    .badge-card.tier-gold {
      border-color: #ffd700;
    }

    .badge-card.tier-platinum {
      border-color: #e5e4e2;
      background: linear-gradient(135deg, var(--ion-color-light), rgba(229, 228, 226, 0.2));
    }

    .badge-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background: var(--ion-color-light-shade);
    }

    .tier-bronze .badge-icon {
      background: rgba(205, 127, 50, 0.15);
      color: #cd7f32;
    }

    .tier-silver .badge-icon {
      background: rgba(192, 192, 192, 0.15);
      color: #808080;
    }

    .tier-gold .badge-icon {
      background: rgba(255, 215, 0, 0.15);
      color: #daa520;
    }

    .tier-platinum .badge-icon {
      background: rgba(229, 228, 226, 0.2);
      color: #6c63ff;
    }

    .badge-name {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 4px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .badge-tier {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .tier-bronze .badge-tier { color: #cd7f32; }
    .tier-silver .badge-tier { color: #808080; }
    .tier-gold .badge-tier { color: #daa520; }
    .tier-platinum .badge-tier { color: #6c63ff; }

    .badge-progress {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .progress-bar {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--ion-color-medium-tint);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 2px;
      background: var(--ion-color-primary);
      transition: width 0.4s ease;
    }

    .progress-text {
      font-size: 10px;
      color: var(--ion-color-medium);
      min-width: 28px;
      text-align: right;
    }

    .badge-date {
      font-size: 10px;
      color: var(--ion-color-medium);
    }
  `]
})
export class BadgeCardComponent {
  @Input({ required: true }) badge!: BadgeResponse;

  getIconName(): string {
    const icon = String(this.badge?.iconUrl || '').trim();
    if (icon && !icon.includes('/')) {
      return icon;
    }

    switch (this.badge?.tier) {
      case 'bronze':
        return 'medal-outline';
      case 'silver':
        return 'ribbon-outline';
      case 'gold':
        return 'trophy-outline';
      case 'platinum':
        return 'diamond-outline';
      default:
        return 'ribbon-outline';
    }
  }
}
