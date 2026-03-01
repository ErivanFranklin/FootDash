import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonSearchbar, IonChip, IonIcon, IonButton, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, shieldOutline, personOutline, footballOutline, timeOutline, trashOutline, closeOutline } from 'ionicons/icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, filter } from 'rxjs/operators';
import { SearchService, SearchResultItem, SearchType } from '../../core/services/search.service';

export interface FilterChip {
  label: string;
  value: string;
  selected?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, IonSearchbar, IonChip, IonIcon, IonButton, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Search & Filter</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onClose()">
            <ion-icon name="close-outline"></ion-icon>
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
          placeholder="Search teams, users, matches..."
          [debounce]="300">
        </ion-searchbar>

        <!-- Type Filter Chips -->
        <div class="filter-chips">
          <ion-chip
            *ngFor="let chip of typeChips"
            [class.chip-selected]="chip.selected"
            (click)="onTypeSelect(chip)">
            <ion-icon *ngIf="chip.icon" [name]="chip.icon"></ion-icon>
            {{ chip.label }}
          </ion-chip>
        </div>

        <!-- Loading -->
        <div class="loading-container" *ngIf="loading">
          <ion-spinner name="crescent"></ion-spinner>
        </div>

        <!-- Quick Results -->
        <ion-list *ngIf="quickResults.length > 0" lines="full" class="quick-results">
          <ion-item *ngFor="let item of quickResults" (click)="navigateToResult(item)" button detail>
            <ion-avatar slot="start" *ngIf="item.imageUrl">
              <img [src]="item.imageUrl" [alt]="item.title" />
            </ion-avatar>
            <ion-icon *ngIf="!item.imageUrl" [name]="iconFor(item.type)" slot="start"
              [color]="colorFor(item.type)" style="font-size: 24px; margin-right: 12px"></ion-icon>
            <ion-label>
              <h3>{{ item.title }}</h3>
              <p *ngIf="item.subtitle">{{ item.subtitle }}</p>
            </ion-label>
            <ion-badge slot="end" [color]="colorFor(item.type)">{{ item.type }}</ion-badge>
          </ion-item>
        </ion-list>

        <!-- See All Results link -->
        <div class="see-all" *ngIf="totalResults > quickResults.length">
          <ion-button fill="clear" (click)="openFullResults()">
            See all {{ totalResults }} results →
          </ion-button>
        </div>

        <!-- Recent Searches -->
        <div *ngIf="!searchText && recentSearches.length > 0" class="recent-section">
          <div class="section-header">
            <span class="section-title">Recent Searches</span>
            <ion-button fill="clear" size="small" (click)="clearRecent()">Clear</ion-button>
          </div>
          <ion-list lines="none">
            <ion-item *ngFor="let recent of recentSearches" (click)="useRecent(recent)" button>
              <ion-icon name="time-outline" slot="start" color="medium"></ion-icon>
              <ion-label>{{ recent }}</ion-label>
              <ion-button fill="clear" slot="end" (click)="removeRecent($event, recent)">
                <ion-icon name="trash-outline" color="medium"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="searched && !loading && quickResults.length === 0">
          <ion-icon name="search-outline" style="font-size: 48px; color: var(--ion-color-medium)"></ion-icon>
          <p>No results found</p>
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

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .quick-results {
      margin-bottom: 8px;
    }

    .see-all {
      text-align: center;
      margin-bottom: 16px;
    }

    .recent-section {
      margin-top: 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
    }

    .section-title {
      font-weight: 600;
      color: var(--ion-color-medium);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    ion-header ion-toolbar {
      --background: var(--ion-color-primary);
      --color: var(--ion-color-primary-contrast);
    }

    ion-avatar {
      width: 36px;
      height: 36px;
    }
  `]
})
export class SearchOverlayComponent implements OnInit, OnDestroy {
  @Input() filterChips: FilterChip[] = [];
  @Output() searchQuery = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterChip[]>();
  @Output() closeOverlay = new EventEmitter<void>();

  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;
  private recentSub?: Subscription;

  searchText = '';
  quickResults: SearchResultItem[] = [];
  recentSearches: string[] = [];
  totalResults = 0;
  loading = false;
  searched = false;
  selectedType: SearchType = 'all';

  typeChips: FilterChip[] = [
    { label: 'All', value: 'all', icon: 'search-outline', selected: true },
    { label: 'Teams', value: 'teams', icon: 'shield-outline' },
    { label: 'Users', value: 'users', icon: 'person-outline' },
    { label: 'Matches', value: 'matches', icon: 'football-outline' },
  ];

  constructor() {
    addIcons({ searchOutline, shieldOutline, personOutline, footballOutline, timeOutline, trashOutline, closeOutline });
  }

  ngOnInit(): void {
    this.recentSub = this.searchService.recentSearches$.subscribe(
      (r) => (this.recentSearches = r),
    );

    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((q) => q.length >= 2),
        tap(() => {
          this.loading = true;
          this.searched = true;
        }),
        switchMap((q) =>
          this.searchService.search(q, this.selectedType, 1, 5),
        ),
      )
      .subscribe({
        next: (res) => {
          this.quickResults = res.results;
          this.totalResults = res.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.recentSub?.unsubscribe();
  }

  onSearchChange(): void {
    this.searchQuery.emit(this.searchText);
    if (this.searchText.length >= 2) {
      this.searchSubject.next(this.searchText);
    } else {
      this.quickResults = [];
      this.totalResults = 0;
      this.searched = false;
    }
  }

  onTypeSelect(chip: FilterChip): void {
    this.typeChips.forEach((c) => (c.selected = false));
    chip.selected = true;
    this.selectedType = chip.value as SearchType;
    if (this.searchText.length >= 2) {
      this.searchSubject.next(this.searchText);
    }
  }

  navigateToResult(item: SearchResultItem): void {
    this.onClose();
    this.router.navigateByUrl(item.url);
  }

  openFullResults(): void {
    this.onClose();
    this.router.navigate(['/search'], {
      queryParams: { q: this.searchText, type: this.selectedType },
    });
  }

  useRecent(query: string): void {
    this.searchText = query;
    this.onSearchChange();
  }

  removeRecent(event: MouseEvent, query: string): void {
    event.stopPropagation();
    this.searchService.removeRecent(query);
  }

  clearRecent(): void {
    this.searchService.clearRecent();
  }

  onClose(): void {
    this.closeOverlay.emit();
  }

  iconFor(type: string): string {
    return SearchService.iconForType(type);
  }

  colorFor(type: string): string {
    return SearchService.colorForType(type);
  }
}
