import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSearchbar, IonChip, IonIcon, IonButton, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/angular/standalone';

export interface FilterChip {
  label: string;
  value: string;
  selected?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, IonSearchbar, IonChip, IonIcon, IonButton, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Search & Filter</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onClose()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="search-container">
        <!-- Search Bar -->
        <ion-searchbar
          [(ngModel)]="searchText"
          (ionInput)="onSearchChange()"
          placeholder="Search matches..."
          [debounce]="300">
        </ion-searchbar>

        <!-- Filter Chips -->
        <div class="filter-chips" *ngIf="filterChips?.length">
          <ion-chip
            *ngFor="let chip of filterChips"
            [class.chip-selected]="chip.selected"
            (click)="onChipToggle(chip)">
            <ion-icon *ngIf="chip.icon" [name]="chip.icon"></ion-icon>
            {{ chip.label }}
          </ion-chip>
        </div>

        <!-- Clear Filters -->
        <div class="filter-actions" *ngIf="hasActiveFilters()">
          <ion-button fill="clear" size="small" (click)="onClearFilters()">
            <ion-icon slot="start" name="close-circle-outline"></ion-icon>
            Clear all filters
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .search-container {
      padding: 16px;
    }

    ion-searchbar {
      --background: var(--ion-color-light);
      --border-radius: 12px;
      --box-shadow: none;
      --placeholder-opacity: 0.6;
      padding: 0;
      margin-bottom: 16px;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    ion-chip {
      --background: var(--ion-color-light);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    ion-chip.chip-selected {
      --background: var(--ion-color-primary);
      --color: var(--ion-color-primary-contrast);
    }

    ion-chip:active {
      transform: scale(0.95);
    }

    .filter-actions {
      display: flex;
      justify-content: center;
      padding: 8px 0;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    ion-header ion-toolbar {
      --background: var(--ion-color-primary);
      --color: var(--ion-color-primary-contrast);
    }
  `]
})
export class SearchOverlayComponent {
  @Input() filterChips: FilterChip[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterChip[]>();
  @Output() close = new EventEmitter<void>();

  searchText = '';

  onSearchChange() {
    this.search.emit(this.searchText);
  }

  onChipToggle(chip: FilterChip) {
    chip.selected = !chip.selected;
    this.filterChange.emit(this.filterChips);
  }

  onClearFilters() {
    this.searchText = '';
    this.filterChips.forEach(chip => chip.selected = false);
    this.search.emit('');
    this.filterChange.emit(this.filterChips);
  }

  onClose() {
    this.close.emit();
  }

  hasActiveFilters(): boolean {
    return !!this.searchText || this.filterChips.some(chip => chip.selected);
  }
}
