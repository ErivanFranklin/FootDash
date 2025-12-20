import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, ToastController } from '@ionic/angular/standalone';
import { NavigationMenuComponent } from './shared/components/navigation-menu.component';
import { WebsocketService } from './services/websocket.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, NavigationMenuComponent],
})
export class AppComponent implements OnInit {
  private websocketService = inject(WebsocketService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);

  ngOnInit() {
    this.setupSocialNotifications();
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
