import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Success</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="container">
        <ion-icon name="checkmark-circle" color="success"></ion-icon>
        <h1>Payment Successful!</h1>
        <p>You are now a Pro member.</p>
        <ion-button routerLink="/home" expand="block">Go Home</ion-button>
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
      ion-icon { font-size: 6rem; margin-bottom: 24px; }
      h1 { margin-bottom: 8px; }
      p { margin-bottom: 32px; color: var(--ion-color-medium); }
    }
  `]
})
export class PaymentSuccessPage {}
