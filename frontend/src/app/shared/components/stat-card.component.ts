import { Component, Input } from '@angular/core';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <ion-card class="stat-card" [class]="variant" role="group" [attr.aria-label]="ariaLabel || label">
      <ion-card-content>
        <div class="stat-content">
          <div class="stat-icon" *ngIf="icon" aria-hidden="true">
            <ion-icon [name]="icon"></ion-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" [attr.aria-label]="valueAriaLabel || (label + ' value')">{{ value }}</div>
            <div class="stat-label">{{ label }}</div>
            <div class="stat-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
            <div class="stat-change" *ngIf="change !== undefined" aria-live="polite">
              <ion-icon [name]="changeIcon"></ion-icon>
              <span>{{ changeText }}</span>
            </div>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .stat-card {
      margin: var(--spacing-sm);
      text-align: center;
    }

    .stat-card.primary {
      --background: var(--ion-color-primary);
      --color: var(--ion-color-primary-contrast);
    }

    .stat-card.secondary {
      --background: var(--ion-color-secondary);
      --color: var(--ion-color-secondary-contrast);
    }

    .stat-card.success {
      --background: var(--ion-color-success);
      --color: var(--ion-color-success-contrast);
    }

    .stat-card.warning {
      --background: var(--ion-color-warning);
      --color: var(--ion-color-warning-contrast);
    }

    .stat-card.danger {
      --background: var(--ion-color-danger);
      --color: var(--ion-color-danger-contrast);
    }

    .stat-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
    }

    .stat-icon {
      font-size: 2rem;
      opacity: 0.8;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1;
    }

    .stat-label {
      font-size: var(--font-size-sm);
      opacity: 0.8;
      margin-top: var(--spacing-xs);
    }

    .stat-change {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      margin-top: var(--spacing-xs);
    }

    .stat-change ion-icon {
      font-size: 1rem;
    }
  `],
  imports: [IonCard, IonCardContent, IonIcon, CommonModule]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | '' = '';
  @Input() change?: number;
  @Input() ariaLabel?: string;
  @Input() valueAriaLabel?: string;

  get changeIcon(): string {
    if (this.change === undefined) return '';
    return this.change >= 0 ? 'trending-up' : 'trending-down';
  }

  get changeText(): string {
    if (this.change === undefined) return '';
    const sign = this.change >= 0 ? '+' : '';
    return `${sign}${this.change}`;
  }
}