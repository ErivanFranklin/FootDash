import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="error-container">
        <div class="error-illustration">
          <div class="error-code">404</div>
          <div class="error-icon">
            <svg viewBox="0 0 200 200" width="180" height="180">
              <circle cx="100" cy="100" r="90" fill="var(--ion-color-light)" stroke="var(--ion-color-medium)" stroke-width="2"/>
              <text x="100" y="90" text-anchor="middle" font-size="36" fill="var(--ion-color-medium)">⚽</text>
              <text x="100" y="130" text-anchor="middle" font-size="16" fill="var(--ion-color-medium)">Off the pitch!</text>
            </svg>
          </div>
        </div>

        <h1>Page Not Found</h1>
        <p class="message">
          The page you're looking for doesn't exist or has been moved.
          It seems you wandered off the pitch!
        </p>

        <div class="actions">
          <ion-button routerLink="/home" expand="block" color="primary">
            <ion-icon name="home-outline" slot="start"></ion-icon>
            Go Home
          </ion-button>
          <ion-button routerLink="/search" expand="block" fill="outline" color="medium">
            <ion-icon name="search-outline" slot="start"></ion-icon>
            Search
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      text-align: center;
      padding: 24px;
    }

    .error-illustration {
      margin-bottom: 24px;
    }

    .error-code {
      font-size: 96px;
      font-weight: 800;
      color: var(--ion-color-primary);
      line-height: 1;
      margin-bottom: 16px;
      letter-spacing: -4px;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 16px 0 8px;
      color: var(--ion-text-color);
    }

    .message {
      color: var(--ion-color-medium);
      font-size: 1rem;
      max-width: 400px;
      margin: 0 auto 32px;
      line-height: 1.6;
    }

    .actions {
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `],
})
export class NotFoundPage {
  constructor() {
    addIcons({ homeOutline, searchOutline });
  }
}
