import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardContent, IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-team-skeleton',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardContent, IonSkeletonText],
  template: `
    <ion-card>
      <ion-card-header>
        <div style="display: flex; align-items: center; gap: 16px;">
          <ion-skeleton-text [animated]="true" style="width: 60px; height: 60px; border-radius: 8px;"></ion-skeleton-text>
          <div style="flex: 1;">
            <ion-skeleton-text [animated]="true" style="width: 70%; height: 20px; margin-bottom: 8px;"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 50%; height: 16px;"></ion-skeleton-text>
          </div>
        </div>
      </ion-card-header>
      
      <ion-card-content>
        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
          <ion-skeleton-text [animated]="true" style="flex: 1; height: 16px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="flex: 1; height: 16px;"></ion-skeleton-text>
        </div>
        <ion-skeleton-text [animated]="true" style="width: 60%; height: 16px;"></ion-skeleton-text>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 8px 12px;
    }
  `]
})
export class TeamSkeletonComponent {}
