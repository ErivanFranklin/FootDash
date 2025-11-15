import { Component, Input } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './loading-spinner.component';

@Component({
  selector: 'app-data-card',
  standalone: true,
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ title }}</ion-card-title>
        <ion-card-subtitle *ngIf="subtitle">{{ subtitle }}</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <ng-content></ng-content>
        <div class="card-actions" *ngIf="actions?.length">
          <ion-button
            *ngFor="let action of actions"
            [size]="action.size || 'small'"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled"
            (click)="action.handler()">
            <ng-container *ngIf="!action.loading; else loadingTemplate">
              {{ action.label }}
            </ng-container>
            <ng-template #loadingTemplate>
              <app-loading-spinner [spinnerName]="action.spinnerName || 'lines-small'"></app-loading-spinner>
            </ng-template>
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .card-actions {
      margin-top: var(--spacing-md);
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, CommonModule, LoadingSpinnerComponent]
})
export class DataCardComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() actions?: Array<{
    label: string;
    handler: () => void;
    color?: string;
    size?: string;
    disabled?: boolean;
    loading?: boolean;
    spinnerName?: string;
  }>;
}