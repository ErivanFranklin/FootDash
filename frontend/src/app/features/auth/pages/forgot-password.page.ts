import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonText, IonSpinner,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Forgot Password</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="form-wrapper">
        @if (!submitted) {
          <p class="instructions">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input [(ngModel)]="email" type="email" inputmode="email" autocomplete="email"></ion-input>
          </ion-item>

          <ion-button expand="block" (click)="submit()" [disabled]="loading">
            @if (loading) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Send Reset Link
            }
          </ion-button>
        } @else {
          <div class="success-state">
            <ion-text color="success">
              <h2>Check your email</h2>
            </ion-text>
            <p>
              If an account with <strong>{{ email }}</strong> exists, we've sent a password reset link.
              It will expire in 30 minutes.
            </p>
            <ion-button expand="block" fill="outline" routerLink="/login">
              Back to Login
            </ion-button>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .form-wrapper {
      padding: 16px;
      max-width: 480px;
      margin: 0 auto;
    }
    .instructions {
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }
    ion-button {
      margin-top: 16px;
    }
    .success-state {
      text-align: center;
      padding-top: 32px;
    }
    .success-state p {
      margin: 16px 0 24px;
      color: var(--ion-color-medium);
    }
  `],
})
export class ForgotPasswordPage {
  email = '';
  loading = false;
  submitted = false;

  private http = inject(HttpClient);
  private toast = inject(ToastController);
  private logger = inject(LoggerService);

  private authUrl = buildAuthUrl();

  submit() {
    if (!this.email) {
      this.toast.create({ message: 'Please enter your email address.', duration: 2000, color: 'warning' })
        .then(t => t.present());
      return;
    }

    this.loading = true;
    this.http.post<any>(`${this.authUrl}/forgot-password`, { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.logger.error('Forgot password request failed', err);
        // Still show success to prevent email enumeration
        this.submitted = true;
      },
    });
  }
}

function buildAuthUrl(): string {
  const base = environment.apiBaseUrl?.replace(/\/$/, '') || '';
  const path = environment.authPath?.startsWith('/') ? environment.authPath : `/${environment.authPath || ''}`;
  return `${base}${path}` || '/auth';
}
