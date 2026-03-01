import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonIcon, IonButton, IonButtons, IonBackButton, IonSpinner, IonText,
  IonItemSliding, IonItemOptions, IonItemOption, IonInfiniteScroll, IonInfiniteScrollContent,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline, heartOutline, chatbubbleOutline, atOutline,
  informationCircleOutline, notificationsOutline, checkmarkDoneOutline, trashOutline,
} from 'ionicons/icons';
import {
  NotificationCenterService, Alert, AlertType,
} from '../../core/services/notification-center.service';
import { LoggerService } from '../../core/services/logger.service';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonIcon, IonButton, IonButtons, IonBackButton, IonSpinner, IonText,
    IonItemSliding, IonItemOptions, IonItemOption, IonInfiniteScroll, IonInfiniteScrollContent,
    IonRefresher, IonRefresherContent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          @if (notifications.length > 0) {
            <ion-button (click)="markAllRead()">
              <ion-icon slot="icon-only" name="checkmark-done-outline"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (loading && notifications.length === 0) {
        <div class="center-spinner"><ion-spinner name="crescent"></ion-spinner></div>
      } @else if (notifications.length === 0) {
        <div class="empty-state">
          <ion-icon name="notifications-outline" class="empty-icon"></ion-icon>
          <ion-text color="medium"><p>No notifications yet</p></ion-text>
        </div>
      } @else {
        <ion-list>
          @for (alert of notifications; track alert.id) {
            <ion-item-sliding>
              <ion-item
                [button]="true"
                (click)="onTap(alert)"
                [class.unread]="!alert.isRead"
              >
                <ion-icon
                  [name]="iconFor(alert.alertType)"
                  [color]="colorFor(alert.alertType)"
                  slot="start"
                ></ion-icon>
                <ion-label>
                  <h3 [class.bold]="!alert.isRead">{{ alert.title }}</h3>
                  <p>{{ alert.message }}</p>
                  <p class="timestamp">{{ relativeTime(alert.createdAt) }}</p>
                </ion-label>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" (click)="deleteNotification(alert)">
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>

        <ion-infinite-scroll (ionInfinite)="loadMore($event)" [disabled]="!hasMore">
          <ion-infinite-scroll-content loadingSpinner="crescent"></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }
    </ion-content>
  `,
  styles: [`
    .center-spinner {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 16px;
    }
    .empty-icon {
      font-size: 64px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }
    .unread {
      --background: var(--ion-color-primary-tint);
    }
    .bold {
      font-weight: 600;
    }
    .timestamp {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
  `],
})
export class NotificationsPage implements OnInit {
  notifications: Alert[] = [];
  loading = false;
  hasMore = true;
  private page = 1;
  private readonly limit = 20;

  private svc = inject(NotificationCenterService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  constructor() {
    addIcons({
      personAddOutline, heartOutline, chatbubbleOutline, atOutline,
      informationCircleOutline, notificationsOutline, checkmarkDoneOutline, trashOutline,
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.page = 1;
    this.svc.getAlerts(this.page, this.limit).subscribe({
      next: (res) => {
        this.notifications = res.alerts;
        this.hasMore = res.hasMore;
        this.loading = false;
      },
      error: (err) => {
        this.logger.error('Error loading notifications', err);
        this.loading = false;
      },
    });
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.page++;
    this.svc.getAlerts(this.page, this.limit).subscribe({
      next: (res) => {
        this.notifications = [...this.notifications, ...res.alerts];
        this.hasMore = res.hasMore;
        event.target.complete();
      },
      error: (err) => {
        this.logger.error('Error loading more notifications', err);
        event.target.complete();
      },
    });
  }

  doRefresh(event: RefresherCustomEvent) {
    this.page = 1;
    this.svc.getAlerts(this.page, this.limit).subscribe({
      next: (res) => {
        this.notifications = res.alerts;
        this.hasMore = res.hasMore;
        this.svc.loadUnreadCount();
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  onTap(alert: Alert) {
    if (!alert.isRead) {
      this.svc.markAsRead(alert.id).subscribe();
      alert.isRead = true;
    }
    if (alert.actionUrl) {
      this.router.navigateByUrl(alert.actionUrl);
    }
  }

  markAllRead() {
    this.svc.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => (n.isRead = true));
    });
  }

  deleteNotification(alert: Alert) {
    this.svc.deleteAlert(alert.id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== alert.id);
    });
  }

  iconFor(type: AlertType): string {
    return NotificationCenterService.iconForType(type);
  }

  colorFor(type: AlertType): string {
    return NotificationCenterService.colorForType(type);
  }

  relativeTime(dateStr: string): string {
    return NotificationCenterService.relativeTime(dateStr);
  }
}
