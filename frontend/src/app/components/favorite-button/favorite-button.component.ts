import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';
import { FavoritesService, FavoriteEntityType } from '../../services/favorites.service';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <ion-button 
      fill="clear" 
      [color]="isFavorite ? 'danger' : 'medium'" 
      (click)="toggle($event)"
      [disabled]="loading"
      size="small">
      <ion-icon [name]="isFavorite ? 'heart' : 'heart-outline'" slot="icon-only"></ion-icon>
    </ion-button>
  `,
  styles: [`
    :host { display: inline-block; }
    ion-button { --padding-start: 4px; --padding-end: 4px; }
  `]
})
export class FavoriteButtonComponent implements OnInit {
  @Input({ required: true }) entityType!: FavoriteEntityType;
  @Input({ required: true }) entityId!: number;

  isFavorite = false;
  loading = false;

  private favoritesService = inject(FavoritesService);

  constructor() {
    addIcons({ heart, heartOutline });
  }

  ngOnInit() {
    // Start from in-memory cache to avoid an initial visual flicker.
    this.isFavorite = this.favoritesService.isFavoriteLocal(this.entityType, this.entityId);

    this.favoritesService.isFavorite(this.entityType, this.entityId).subscribe({
      next: (res) => {
        this.isFavorite = res.isFavorite;
      },
      error: () => {
        // Preserve the locally known state when older or unauthenticated backends reject the probe.
      },
    });
  }

  toggle(event: Event) {
    event.stopPropagation();
    this.loading = true;

    if (this.isFavorite) {
      this.favoritesService.removeFavorite(this.entityType, this.entityId).subscribe({
        next: () => {
          this.isFavorite = false;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.favoritesService.addFavorite(this.entityType, this.entityId).subscribe({
        next: () => {
          this.isFavorite = true;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }
}
