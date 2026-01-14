import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardContent, IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-match-skeleton',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardContent, IonSkeletonText],
  template: `
    <ion-card>
      <ion-card-header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <ion-skeleton-text [animated]="true" style="width: 60%; height: 20px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 60px; height: 24px; border-radius: 12px;"></ion-skeleton-text>
        </div>
      </ion-card-header>
      
      <ion-card-content>
        <!-- Score skeleton -->
        <div style="display: flex; justify-content: center; gap: 16px; margin: 16px 0; padding: 16px 0; border-top: 1px solid var(--ion-color-light-shade); border-bottom: 1px solid var(--ion-color-light-shade);">
          <ion-skeleton-text [animated]="true" style="width: 48px; height: 40px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 20px; height: 40px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 48px; height: 40px;"></ion-skeleton-text>
        </div>
        
        <!-- Match info skeleton -->
        <div style="margin: 12px 0;">
          <ion-skeleton-text [animated]="true" style="width: 80%; height: 16px; margin-bottom: 8px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 65%; height: 16px; margin-bottom: 8px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="width: 70%; height: 16px;"></ion-skeleton-text>
        </div>
        
        <!-- Actions skeleton -->
        <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--ion-color-light-shade);">
          <ion-skeleton-text [animated]="true" style="flex: 1; height: 36px; border-radius: 8px;"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" style="flex: 1; height: 36px; border-radius: 8px;"></ion-skeleton-text>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    ion-card {
      margin: 8px 12px;
    }
  `]
})
export class MatchSkeletonComponent {}
