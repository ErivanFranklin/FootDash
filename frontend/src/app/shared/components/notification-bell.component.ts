import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { NotificationCenterService } from '../../core/services/notification-center.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, IonButton, IonIcon, IonBadge],
  template: `
    <ion-button fill="clear" routerLink="/notifications" class="bell-btn" aria-label="Notifications">
      <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
      @if ((unreadCount$ | async); as count) {
        @if (count > 0) {
          <ion-badge color="danger" class="badge">{{ count > 99 ? '99+' : count }}</ion-badge>
        }
      }
    </ion-button>
  `,
  styles: [`
    :host {
      position: relative;
      display: inline-block;
    }
    .bell-btn {
      position: relative;
    }
    .badge {
      position: absolute;
      top: 2px;
      right: -2px;
      font-size: 10px;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      padding: 0 4px;
      line-height: 18px;
    }
  `],
})
export class NotificationBellComponent {
  private notifications = inject(NotificationCenterService);
  unreadCount$ = this.notifications.unreadCount$;

  constructor() {
    addIcons({ notificationsOutline });
  }
}
