import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonText, IonSpinner, IonNote,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Reset Password</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="form-wrapper">
        @if (!token) {
          <div class="error-state">
            <ion-text color="danger"><h2>Invalid Link</h2></ion-text>
            <p>This password reset link is invalid or missing a token.</p>
            <ion-button expand="block" fill="outline" routerLink="/auth/forgot-password">
              Request a New Link
            </ion-button>
          </div>
        } @else if (success) {
          <div class="success-state">
            <ion-text color="success"><h2>Password Reset!</h2></ion-text>
            <p>Your password has been reset successfully. You can now sign in with your new password.</p>
            <ion-button expand="block" routerLink="/login">Go to Login</ion-button>
          </div>
        } @else {
          <p class="instructions">Enter your new password below.</p>

          <ion-item>
            <ion-label position="stacked">New Password</ion-label>
            <ion-input [(ngModel)]="newPassword" type="password" minlength="8"></ion-input>
          </ion-item>
          @if (newPassword && newPassword.length < 8) {
            <ion-note color="danger" class="field-note">Must be at least 8 characters</ion-note>
          }

          <ion-item>
            <ion-label position="stacked">Confirm Password</ion-label>
            <ion-input [(ngModel)]="confirmPassword" type="password"></ion-input>
          </ion-item>
          @if (confirmPassword && newPassword !== confirmPassword) {
            <ion-note color="danger" class="field-note">Passwords do not match</ion-note>
          }

          <ion-button expand="block" (click)="submit()" [disabled]="loading || !isValid()">
            @if (loading) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Reset Password
            }
          </ion-button>

          @if (errorMessage) {
            <ion-text color="danger"><p class="error-text">{{ errorMessage }}</p></ion-text>
          }
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
    ion-button { margin-top: 16px; }
    .success-state, .error-state {
      text-align: center;
      padding-top: 32px;
    }
    .success-state p, .error-state p {
      margin: 16px 0 24px;
      color: var(--ion-color-medium);
    }
    .field-note {
      display: block;
      padding: 4px 16px;
      font-size: 12px;
    }
    .error-text {
      text-align: center;
      margin-top: 12px;
    }
  `],
})
export class ResetPasswordPage implements OnInit {
  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  loading = false;
  success = false;
  errorMessage = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastController);
  private logger = inject(LoggerService);

  private authUrl = buildAuthUrl();

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  isValid(): boolean {
    return (
      !!this.newPassword &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  submit() {
    if (!this.isValid() || !this.token) return;

    this.loading = true;
    this.errorMessage = '';

    this.http
      .post<any>(`${this.authUrl}/reset-password`, {
        token: this.token,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          this.toast
            .create({ message: 'Password reset successfully!', duration: 3000, color: 'success' })
            .then(t => t.present());
        },
        error: (err) => {
          this.loading = false;
          this.logger.error('Password reset failed', err);
          this.errorMessage =
            err?.error?.message || 'Reset failed. The link may have expired — please request a new one.';
        },
      });
  }
}

function buildAuthUrl(): string {
  const base = environment.apiBaseUrl?.replace(/\/$/, '') || '';
  const path = environment.authPath?.startsWith('/') ? environment.authPath : `/${environment.authPath || ''}`;
  return `${base}${path}` || '/auth';
}
