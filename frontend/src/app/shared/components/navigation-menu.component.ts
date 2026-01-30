import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navigation-menu',
  template: `
    <ion-list>
      <ion-item button (click)="navigateTo('/home')">
        <ion-icon name="home" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.HOME' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/teams')">
        <ion-icon name="people" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.TEAMS' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/feed')">
        <ion-icon name="heart" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.FEED' | transloco }}</ion-label>
      </ion-item>
      <ion-item button (click)="navigateToProfile()">
        <ion-icon name="person" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.PROFILE' | transloco }}</ion-label>
      </ion-item>
      
      <ion-item-divider>
        <ion-label>{{ 'NAV.SETTINGS' | transloco }}</ion-label>
      </ion-item-divider>

      <ion-item>
        <ion-icon name="globe" slot="start"></ion-icon>
        <ion-select [interfaceOptions]="{header: 'Language'}" 
                    [value]="currentLang" 
                    (ionChange)="changeLanguage($event)">
          <ion-select-option value="en">English (US)</ion-select-option>
          <ion-select-option value="es">Español</ion-select-option>
          <ion-select-option value="pt">Português (BR)</ion-select-option>
        </ion-select>
      </ion-item>
      
      <ion-item button lines="none" color="danger" (click)="logout()">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.LOGOUT' | transloco }}</ion-label>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, TranslocoPipe, FormsModule],
})
export class NavigationMenuComponent {
  private router = inject(Router);
  private languageService = inject(LanguageService);
  private authService = inject(AuthService);

  currentLang = 'en';

  constructor() {
    this.currentLang = this.languageService.currentLang();
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  navigateToProfile() {
    const id = this.authService.getCurrentUserId();
    if (id) {
       this.router.navigate(['/user-profile', id]);
    } else {
       // fallback or ignored if not logged in
       this.navigateTo('/home'); 
    }
  }
  
  logout() {
    this.authService.logout();
    this.navigateTo('/login');
  }

  changeLanguage(event: any) {
    this.languageService.setLanguage(event.detail.value);
  }
}