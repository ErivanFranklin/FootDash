import { Component, Input } from '@angular/core';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-section',
  standalone: true,
  template: `
    <ion-card class="form-section-card">
      <ion-card-header *ngIf="title">
        <ion-card-title>{{ title }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ng-content></ng-content>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .form-section-card {
      margin: var(--spacing-md) 0;
    }

    .form-section-card ion-card-content {
      padding: var(--spacing-lg);
    }
  `],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, CommonModule]
})
export class FormSectionComponent {
  @Input() title?: string;
}