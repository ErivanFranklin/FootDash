import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SubscriptionService } from '../../../../services/subscription.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-pro-page',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslocoPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>MatchPro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="pro-container">
        <div class="hero">
          <h1>{{ 'SUBSCRIPTION.TITLE' | transloco }}</h1>
          <p>{{ 'SUBSCRIPTION.SUBTITLE' | transloco }}</p>
        </div>

        <div class="features-list">
          <ion-list>
            <ion-item>
              <ion-icon name="stats-chart-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h2>{{ 'SUBSCRIPTION.FEATURE_1_TITLE' | transloco }}</h2>
                <p>{{ 'SUBSCRIPTION.FEATURE_1_DESC' | transloco }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="chatbubbles-outline" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h2>{{ 'SUBSCRIPTION.FEATURE_2_TITLE' | transloco }}</h2>
                <p>{{ 'SUBSCRIPTION.FEATURE_2_DESC' | transloco }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon name="trophy-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h2>{{ 'SUBSCRIPTION.FEATURE_3_TITLE' | transloco }}</h2>
                <p>{{ 'SUBSCRIPTION.FEATURE_3_DESC' | transloco }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>

        <div class="pricing-card">
          <div class="price">
            <span class="currency">$</span>
            <span class="amount">4.99</span>
            <span class="period">/mo</span>
          </div>
          <ion-button expand="block" (click)="subscribe()">
            {{ 'SUBSCRIPTION.SUBSCRIBE_BTN' | transloco }}
          </ion-button>
          <p class="disclaimer">{{ 'SUBSCRIPTION.DISCLAIMER' | transloco }}</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .pro-container {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .hero {
      text-align: center;
      margin-top: 24px;
      h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; background: linear-gradient(45deg, var(--ion-color-primary), var(--ion-color-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;}
      p { font-size: 1.1rem; color: var(--ion-color-medium); }
    }
    .pricing-card {
      background: var(--ion-card-background);
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      text-align: center;
      .price { margin-bottom: 24px; font-size: 3rem; font-weight: 700; color: var(--ion-color-dark); .currency { font-size: 1.5rem; vertical-align: top; } .period { font-size: 1rem; color: var(--ion-color-medium); } }
      .disclaimer { font-size: 0.8rem; color: var(--ion-color-medium); margin-top: 12px; }
    }
  `]
})
export class ProPage {
  private subscriptionService = inject(SubscriptionService);

  subscribe() {
    this.subscriptionService.startSubscription().subscribe();
  }
}
