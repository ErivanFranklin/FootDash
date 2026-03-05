import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFooter, IonSplitPane } from '@ionic/angular/standalone';
import { NavigationMenuComponent } from './shared/components/navigation-menu.component';
import { WebSocketService as WebsocketService } from './core/services/web-socket.service';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { NotificationCenterService } from './core/services/notification-center.service';
import { OfflineService } from './core/services/offline.service';
import { OfflineQueueService } from './core/services/offline-queue.service';
import { SwUpdateService } from './core/services/sw-update.service';
import { OfflineBannerComponent } from './components/offline-banner/offline-banner.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  home, 
  football, 
  chatbubbles, 
  person, 
  people, 
  heart, 
  globe, 
  logOutOutline, 
  cloudDone,
  cloudOffline,
  checkmarkCircle,
  locationOutline,
  shareSocialOutline,
  trophyOutline,
  timeOutline,
  calendarOutline,
  flagOutline,
  personCircle,
  personOutline,
  pulseOutline,
  starOutline,
  starHalf,
  star,
  chevronForwardOutline,
  chevronBackOutline,
  addCircleOutline,
  pencilOutline,
  trashOutline,
  closeCircleOutline,
  searchOutline,
  filterOutline,
  notificationsOutline,
  settingsOutline,
  eye,
  eyeOff,
  remove,
  removeOutline,
  trendingDownOutline,
  analyticsOutline,
  barChartOutline,
  gitCompareOutline,
  arrowBackOutline,
  arrowForwardOutline,
  bulbOutline,
  closeCircle,
  addCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFooter, IonSplitPane, NavigationMenuComponent, TranslocoPipe, RouterLink, RouterLinkActive, OfflineBannerComponent],
})
export class AppComponent implements OnInit {
  private websocketService = inject(WebsocketService);
  public authService = inject(AuthService);
  private toastController = inject(ToastController);
  private pwaService = inject(PwaService);
  private notificationCenter = inject(NotificationCenterService);
  private offlineService = inject(OfflineService);
  private offlineQueue = inject(OfflineQueueService);
  private swUpdateService = inject(SwUpdateService);
  private router = inject(Router);

  constructor() {
    // Register all icons used across the application
    addIcons({ 
      home, 
      football, 
      chatbubbles, 
      person, 
      people, 
      heart, 
      globe, 
      logOutOutline, 
      cloudDone,
      cloudOffline,
      checkmarkCircle,
      locationOutline,
      shareSocialOutline,
      trophyOutline,
      timeOutline,
      calendarOutline,
      flagOutline,
      personCircle,
      personOutline,
      pulseOutline,
      starOutline,
      starHalf,
      star,
      chevronForwardOutline,
      chevronBackOutline,
      addCircleOutline,
      pencilOutline,
      trashOutline,
      closeCircleOutline,
      searchOutline,
      filterOutline,
      notificationsOutline,
      settingsOutline,
      eye,
      eyeOff,
      remove,
      removeOutline,
      trendingDownOutline,
      analyticsOutline,
      barChartOutline,
      gitCompareOutline,
      arrowBackOutline,
      arrowForwardOutline,
      bulbOutline,
      closeCircle,
      addCircle
    });
  }

  get currentUserId() {
    return this.authService.getCurrentUserId();
  }

  ngOnInit() {
    this.setupSocialNotifications();
    this.pwaService.initPushNotifications();
    this.swUpdateService.init();
  }

  private setupSocialNotifications() {
    this.authService.currentToken$.subscribe(token => {
      if (token) {
        const userId = this.authService.getCurrentUserId();
        if (userId) {
          this.websocketService.subscribeToUser(userId);
          this.notificationCenter.init(userId);
        }
      }
    });

    this.websocketService.onNewFollower().subscribe(async data => {
      const toast = await this.toastController.create({
        message: 'You have a new follower!',
        duration: 3000,
        position: 'top',
        color: 'primary',
        buttons: [
          {
            text: 'View',
            handler: () => {
              if (data?.followerId) {
                this.router.navigate(['/user-profile', data.followerId]);
              }
            }
          }
        ]
      });
      await toast.present();
    });
  }
}
