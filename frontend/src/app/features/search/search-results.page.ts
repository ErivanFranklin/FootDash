import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  shieldOutline,
  personOutline,
  footballOutline,
  closeCircleOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  SearchService,
  SearchType,
  SearchResultItem,
} from '../../core/services/search.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonNote,
    IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Search</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="query"
          (ionInput)="onSearchInput()"
          (keyup.enter)="performSearch()"
          placeholder="Search teams, users, matches..."
          [debounce]="400"
          animated
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Type Filter Chips -->
      <div class="filter-chips">
        <ion-chip
          *ngFor="let t of types"
          [class.chip-selected]="selectedType === t.value"
          (click)="selectType(t.value)"
        >
          <ion-icon [name]="t.icon"></ion-icon>
          {{ t.label }}
        </ion-chip>
      </div>

      <!-- Recent Searches (shown when no query) -->
      <div class="recent-section" *ngIf="!query && recentSearches.length > 0">
        <div class="section-header">
          <span class="section-title">Recent Searches</span>
          <ion-button fill="clear" size="small" (click)="clearRecent()">
            Clear all
          </ion-button>
        </div>
        <ion-list lines="none">
          <ion-item
            *ngFor="let recent of recentSearches"
            (click)="searchRecent(recent)"
            button
          >
            <ion-icon name="time-outline" slot="start" color="medium"></ion-icon>
            <ion-label>{{ recent }}</ion-label>
            <ion-button
              fill="clear"
              slot="end"
              (click)="removeRecent($event, recent)"
            >
              <ion-icon name="trash-outline" color="medium"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- Loading State -->
      <div class="center-content" *ngIf="loading && results.length === 0">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Searching...</p>
      </div>

      <!-- Results -->
      <ion-list *ngIf="results.length > 0" lines="full">
        <ion-item
          *ngFor="let item of results"
          [routerLink]="item.url"
          detail
          button
        >
          <ion-avatar slot="start" *ngIf="item.imageUrl">
            <img [src]="item.imageUrl" [alt]="item.title" />
          </ion-avatar>
          <ion-icon
            *ngIf="!item.imageUrl"
            [name]="iconFor(item.type)"
            slot="start"
            [color]="colorFor(item.type)"
            style="font-size: 28px; margin-right: 12px"
          ></ion-icon>
          <ion-label>
            <h2>{{ item.title }}</h2>
            <p *ngIf="item.subtitle">{{ item.subtitle }}</p>
          </ion-label>
          <ion-badge slot="end" [color]="colorFor(item.type)">
            {{ item.type }}
          </ion-badge>
        </ion-item>
      </ion-list>

      <!-- Empty State -->
      <div
        class="center-content"
        *ngIf="!loading && searched && results.length === 0"
      >
        <ion-icon
          name="search-outline"
          style="font-size: 64px; color: var(--ion-color-medium)"
        ></ion-icon>
        <h3>No results found</h3>
        <p>Try a different search term or filter</p>
      </div>

      <!-- Infinite Scroll -->
      <ion-infinite-scroll
        *ngIf="hasMore"
        (ionInfinite)="loadMore($event)"
      >
        <ion-infinite-scroll-content
          loadingSpinner="crescent"
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [
    `
      .filter-chips {
        display: flex;
        gap: 8px;
        padding: 12px 16px 4px;
        overflow-x: auto;
      }

      ion-chip {
        --background: var(--ion-color-light);
        cursor: pointer;
        flex-shrink: 0;
      }

      ion-chip.chip-selected {
        --background: var(--ion-color-primary);
        --color: var(--ion-color-primary-contrast);
      }

      .recent-section {
        padding: 8px 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
      }

      .section-title {
        font-weight: 600;
        color: var(--ion-color-medium);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .center-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 16px;
        text-align: center;
        color: var(--ion-color-medium);
      }

      .center-content h3 {
        margin-top: 16px;
        margin-bottom: 8px;
      }

      ion-avatar {
        width: 40px;
        height: 40px;
      }
    `,
  ],
})
export class SearchResultsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  query = '';
  selectedType: SearchType = 'all';
  results: SearchResultItem[] = [];
  recentSearches: string[] = [];
  loading = false;
  searched = false;
  hasMore = false;
  page = 1;
  total = 0;

  readonly types = [
    { label: 'All', value: 'all' as SearchType, icon: 'search-outline' },
    { label: 'Teams', value: 'teams' as SearchType, icon: 'shield-outline' },
    { label: 'Users', value: 'users' as SearchType, icon: 'person-outline' },
    {
      label: 'Matches',
      value: 'matches' as SearchType,
      icon: 'football-outline',
    },
  ];

  constructor() {
    addIcons({
      searchOutline,
      shieldOutline,
      personOutline,
      footballOutline,
      closeCircleOutline,
      timeOutline,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.searchService.recentSearches$.subscribe(
      (r) => (this.recentSearches = r),
    );

    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.query = params['q'];
      }
      if (params['type'] && ['all', 'teams', 'users', 'matches'].includes(params['type'])) {
        this.selectedType = params['type'] as SearchType;
      }
      if (this.query) {
        this.performSearch();
      }
    });
  }

  onSearchInput(): void {
    if (this.query.length >= 2) {
      this.performSearch();
    } else if (this.query.length === 0) {
      this.results = [];
      this.searched = false;
    }
  }

  performSearch(): void {
    if (!this.query || this.query.length < 2) return;

    this.loading = true;
    this.page = 1;
    this.results = [];

    this.updateUrl();

    this.searchService
      .search(this.query, this.selectedType, this.page)
      .subscribe({
        next: (res) => {
          this.results = res.results;
          this.total = res.total;
          this.hasMore = this.results.length < this.total;
          this.loading = false;
          this.searched = true;
        },
        error: () => {
          this.loading = false;
          this.searched = true;
        },
      });
  }

  selectType(type: SearchType): void {
    this.selectedType = type;
    if (this.query) {
      this.performSearch();
    }
  }

  loadMore(event: CustomEvent): void {
    this.page++;
    this.searchService
      .search(this.query, this.selectedType, this.page)
      .subscribe({
        next: (res) => {
          this.results.push(...res.results);
          this.hasMore = this.results.length < this.total;
          (event.target as HTMLIonInfiniteScrollElement).complete();
        },
        error: () => {
          (event.target as HTMLIonInfiniteScrollElement).complete();
        },
      });
  }

  searchRecent(query: string): void {
    this.query = query;
    this.performSearch();
  }

  removeRecent(event: MouseEvent, query: string): void {
    event.stopPropagation();
    this.searchService.removeRecent(query);
  }

  clearRecent(): void {
    this.searchService.clearRecent();
  }

  iconFor(type: string): string {
    return SearchService.iconForType(type);
  }

  colorFor(type: string): string {
    return SearchService.colorForType(type);
  }

  private updateUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.query, type: this.selectedType },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
