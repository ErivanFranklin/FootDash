import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFooter, IonSplitPane } from '@ionic/angular/standalone';
import { NavigationMenuComponent } from './shared/components/navigation-menu.component';
import { WebsocketService } from './services/websocket.service';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
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
  eye,
  eyeOff,
  remove,
  removeOutline,
  trendingDownOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFooter, IonSplitPane, NavigationMenuComponent, TranslocoPipe, RouterLink, RouterLinkActive],
})
export class AppComponent implements OnInit {
  private websocketService = inject(WebsocketService);
  public authService = inject(AuthService);
  private toastController = inject(ToastController);
  private pwaService = inject(PwaService);
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
      eye,
      eyeOff,
      remove,
      removeOutline,
      trendingDownOutline
    });
  }

  get currentUserId() {
    return this.authService.getCurrentUserId();
  }

  ngOnInit() {
    this.setupSocialNotifications();
    this.pwaService.initPushNotifications();
  }

  private setupSocialNotifications() {
    this.authService.currentToken$.subscribe(token => {
      if (token) {
        const userId = this.authService.getCurrentUserId();
        if (userId) {
          this.websocketService.subscribeToUser(userId);
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
