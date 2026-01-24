import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { FormsModule } from '@angular/forms';

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
      <ion-item button (click)="navigateTo('/user-profile/1')">
        <ion-icon name="person" slot="start"></ion-icon>
        <ion-label>{{ 'NAV.PROFILE' | transloco }}</ion-label>
      </ion-item>
      
      <ion-item-divider>
        <ion-label>{{ 'NAV.SETTINGS' | transloco }}</ion-label>
      </ion-item-divider>

      <ion-item>
        <ion-icon name="globe" slot="start"></ion-icon>
        <ion-select [label]="'Language'" labelPlacement="start" interface="popover" [value]="currentLang()" (ionChange)="onLangChange($event)">
          <ion-select-option *ngFor="let lang of availableLangs" [value]="lang.code">
            {{ lang.flag }} {{ lang.label }}
          </ion-select-option>
        </ion-select>
      </ion-item>

    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, TranslocoPipe, FormsModule]
})
export class NavigationMenuComponent {
  private router = inject(Router);
  public languageService = inject(LanguageService);

  availableLangs = this.languageService.getAvailableLanguages();
  currentLang = this.languageService.currentLang;

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  onLangChange(event: any) {
    this.languageService.setLanguage(event.detail.value);
  }
}