import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-menu',
  template: `
    <ion-list>
      <ion-item button (click)="navigateTo('/home')">
        <ion-icon name="home" slot="start"></ion-icon>
        <ion-label>Dashboard</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/teams')">
        <ion-icon name="people" slot="start"></ion-icon>
        <ion-label>Teams</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/feed')">
        <ion-icon name="heart" slot="start"></ion-icon>
        <ion-label>Social Feed</ion-label>
      </ion-item>
      <ion-item button (click)="navigateTo('/user-profile/1')">
        <ion-icon name="person" slot="start"></ion-icon>
        <ion-label>My Profile</ion-label>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class NavigationMenuComponent {
  private router = inject(Router);

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}