import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, ToastController, IonSplitPane } from '@ionic/angular/standalone';
import { NavigationMenuComponent } from './shared/components/navigation-menu.component';
import { WebsocketService } from './services/websocket.service';
import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, NavigationMenuComponent, TranslocoPipe, IonSplitPane],
})
export class AppComponent implements OnInit {
  private websocketService = inject(WebsocketService);
  public authService = inject(AuthService); // Make public for template access
  private toastController = inject(ToastController);
  private pwaService = inject(PwaService);

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
              // Navigate to followers page or profile
            }
          }
        ]
      });
      await toast.present();
    });
  }
}
