import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="error-container">
        <div class="error-illustration">
          <div class="error-icon">
            <svg viewBox="0 0 200 200" width="180" height="180">
              <circle cx="100" cy="100" r="90" fill="var(--ion-color-light)" stroke="var(--ion-color-danger)" stroke-width="2"/>
              <text x="100" y="85" text-anchor="middle" font-size="48" fill="var(--ion-color-danger)">!</text>
              <text x="100" y="130" text-anchor="middle" font-size="14" fill="var(--ion-color-medium)">Something broke</text>
            </svg>
          </div>
        </div>

        <h1>Something Went Wrong</h1>
        <p class="message">
          An unexpected error occurred. Don't worry — our team has been notified
          and is working on a fix. Please try again.
        </p>

        <div class="actions">
          <ion-button (click)="retry()" expand="block" color="primary">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Try Again
          </ion-button>
          <ion-button routerLink="/home" expand="block" fill="outline" color="medium">
            <ion-icon name="home-outline" slot="start"></ion-icon>
            Go Home
          </ion-button>
        </div>

        <p class="error-id" *ngIf="errorId">
          Error ID: {{ errorId }}
        </p>
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

    .error-id {
      margin-top: 32px;
      font-size: 0.75rem;
      color: var(--ion-color-medium-shade);
      font-family: monospace;
    }
  `],
})
export class ErrorPage implements OnInit {
  errorId?: string;

  constructor() {
    addIcons({ homeOutline, refreshOutline });
  }

  ngOnInit(): void {
    // Generate a simple error ID for support reference
    this.errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
  }

  retry(): void {
    window.history.back();
  }
}
