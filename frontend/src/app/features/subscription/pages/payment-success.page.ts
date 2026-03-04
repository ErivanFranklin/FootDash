import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonSpinner,
    RouterModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Success</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="container">
        @if (loading) {
          <ion-spinner name="crescent"></ion-spinner>
          <h1>Verifying payment...</h1>
          <p>Please wait while we confirm your checkout session.</p>
        } @else if (verified) {
          <ion-icon name="checkmark-circle" color="success"></ion-icon>
          <h1>Payment Successful!</h1>
          <p>You are now a Pro member.</p>
          <ion-button routerLink="/home" expand="block">Go Home</ion-button>
        } @else {
          <ion-icon name="close-circle" color="danger"></ion-icon>
          <h1>Payment verification failed</h1>
          <p>{{ errorMessage }}</p>
          <ion-button routerLink="/pro" expand="block" fill="outline">Back to Pro</ion-button>
          <ion-button routerLink="/home" expand="block">Go Home</ion-button>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      gap: 8px;
      ion-spinner { margin-bottom: 12px; }
      ion-icon { font-size: 6rem; margin-bottom: 24px; }
      h1 { margin-bottom: 8px; }
      p { margin-bottom: 32px; color: var(--ion-color-medium); }
    }
  `]
})
export class PaymentSuccessPage {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  loading = true;
  verified = false;
  errorMessage = 'We could not confirm this payment session.';

  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.loading = false;
      this.verified = false;
      this.errorMessage = 'Missing session ID. Please return to the Pro page and try again.';
      return;
    }

    try {
      const apiUrl = `${environment.apiBaseUrl}/payments/verify-session/${encodeURIComponent(sessionId)}`;
      const result = await firstValueFrom(
        this.http.get<{ verified: boolean }>(apiUrl, { withCredentials: true }),
      );

      this.verified = !!result?.verified;
      if (!this.verified) {
        this.errorMessage = 'Checkout is not completed yet. Please refresh in a moment.';
      }
    } catch {
      this.verified = false;
      this.errorMessage = 'Unable to verify payment right now. Please try again shortly.';
    } finally {
      this.loading = false;
    }
  }
}
