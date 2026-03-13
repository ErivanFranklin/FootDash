import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonIcon, IonLabel, IonItemDivider, IonSelect, IonSelectOption, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService as WebsocketService } from '../../core/services/web-socket.service';
import { addIcons } from 'ionicons';
import {
  home,
  people,
  heart,
  person,
  notificationsOutline,
  pulseOutline,
  gitCompareOutline,
  settingsOutline,
  globe,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-navigation-menu',
  template: `
    <ion-list class="nav-list">
      <ion-item button (click)="navigateTo('/home')" class="nav-item">
        <ion-icon name="home" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.HOME' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/teams')" class="nav-item">
        <ion-icon name="people" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.TEAMS' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/feed')" class="nav-item">
        <ion-icon name="heart" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.FEED' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateToProfile()" class="nav-item">
        <ion-icon name="person" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.PROFILE' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/notifications')" class="nav-item">
        <ion-icon name="notifications-outline" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.NOTIFICATIONS' | transloco }}</ion-label>
      </ion-item>
      
      <ion-item-divider>
        <ion-label>Analytics</ion-label>
      </ion-item-divider>

      <ion-item button (click)="navigateTo('/analytics/predictions')" class="nav-item">
        <ion-icon name="pulse-outline" slot="start"></ion-icon>
        <ion-label>Predictions</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/compare')" class="nav-item">
        <ion-icon name="git-compare-outline" slot="start"></ion-icon>
        <ion-label>Team Compare</ion-label>
      </ion-item>

      <ion-item-divider>
        <ion-label>{{ 'NAV.SETTINGS' | transloco }}</ion-label>
      </ion-item-divider>

      <ion-item button (click)="navigateTo('/settings')" class="nav-item">
        <ion-icon name="settings-outline" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.SETTINGS' | transloco }}</ion-label>
      </ion-item>

      <ion-item class="language-item nav-item">
        <ion-icon name="globe" slot="start"></ion-icon>
        <ion-label>{{ 'SETTINGS.LANGUAGE' | transloco }}</ion-label>
        <ion-select
          slot="end"
          interface="popover"
          [interfaceOptions]="{ header: languageHeader }"
          [value]="currentLang"
          (ionChange)="changeLanguage($event)"
        >
          <ion-select-option value="en">{{ 'LANGUAGE.EN_US' | transloco }}</ion-select-option>
          <ion-select-option value="es">{{ 'LANGUAGE.ES' | transloco }}</ion-select-option>
          <ion-select-option value="pt">{{ 'LANGUAGE.PT_BR' | transloco }}</ion-select-option>
        </ion-select>
      </ion-item>
      
      <ion-item button lines="none" color="danger" (click)="logout()" class="nav-item">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.LOGOUT' | transloco }}</ion-label>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  styles: [`
    .nav-list {
      padding-right: 16px; /* Right margin for the menu items */
    }
    .nav-item {
      --padding-end: 0; /* Align with the list padding */
    }
    .language-item ion-label {
      flex: 1;
      margin-right: 10px;
    }
    .language-item ion-select {
      min-width: 150px;
      max-width: 210px;
      text-align: right;
    }
  `],
  imports: [CommonModule, IonList, IonItem, IonIcon, IonLabel, IonItemDivider, IonSelect, IonSelectOption, TranslocoPipe, FormsModule],
})
export class NavigationMenuComponent {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private languageService = inject(LanguageService);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);
  private websocketService = inject(WebsocketService);

  constructor() {
    addIcons({
      home,
      people,
      heart,
      person,
      'notifications-outline': notificationsOutline,
      'pulse-outline': pulseOutline,
      'git-compare-outline': gitCompareOutline,
      'settings-outline': settingsOutline,
      globe,
      'log-out-outline': logOutOutline
    });
  }

  get currentLang(): string {
    return this.languageService.currentLang();
  }

  get languageHeader(): string {
    return this.translocoService.translate('SETTINGS.LANGUAGE');
  }

  navigateTo(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.navCtrl.navigateRoot(normalizedPath);
  }

  navigateToProfile() {
    const id = this.authService.getCurrentUserId();
    if (id) {
       this.navCtrl.navigateRoot(`/user-profile/${id}`);
    } else {
       this.navigateTo('/home'); 
    }
  }
  
  logout() {
    // Disconnect websockets before logout
    this.websocketService.disconnect();
    this.authService.logout();
    // Small delay to ensure auth state propagates
    setTimeout(() => {
      this.router.navigate(['/login'], { replaceUrl: true });
      // Force page reload to ensure clean state
      window.location.reload();
    }, 100);
  }

  changeLanguage(event: any) {
    this.languageService.setLanguage(event.detail.value);
  }
}