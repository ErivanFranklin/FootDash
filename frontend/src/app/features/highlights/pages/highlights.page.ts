import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote,
  IonIcon,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { addIcons } from 'ionicons';
import { playCircleOutline, eyeOutline, timeOutline } from 'ionicons/icons';

interface Highlight {
  id: number;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  duration: number;
  viewCount: number;
  source: string;
}

@Component({
  selector: 'app-highlights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonNote,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Video Highlights</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          placeholder="Search highlights..."
          [debounce]="400"
          (ionInput)="onSearch($event)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list>
        @for (h of highlights(); track h.id) {
          <ion-item button (click)="openVideo(h)">
            <ion-thumbnail slot="start">
              @if (h.thumbnailUrl) {
                <img [src]="h.thumbnailUrl" [alt]="h.title" />
              } @else {
                <div class="placeholder-thumb">
                  <ion-icon name="play-circle-outline"></ion-icon>
                </div>
              }
            </ion-thumbnail>
            <ion-label>
              <h3>{{ h.title }}</h3>
              <p>
                {{ h.homeTeam }} vs {{ h.awayTeam }}
                @if (h.matchDate) {
                  · {{ h.matchDate }}
                }
              </p>
              <div class="meta-row">
                <span class="meta">
                  <ion-icon name="time-outline"></ion-icon>
                  {{ formatDuration(h.duration) }}
                </span>
                <span class="meta">
                  <ion-icon name="eye-outline"></ion-icon>
                  {{ h.viewCount }} views
                </span>
                <ion-badge color="medium">{{ h.source }}</ion-badge>
              </div>
            </ion-label>
          </ion-item>
        }
      </ion-list>

      @if (highlights().length === 0 && !loading()) {
        <div class="empty-state">
          <ion-icon name="play-circle-outline" class="empty-icon"></ion-icon>
          <h2>No Highlights Found</h2>
          <p>Highlights will appear here as matches are played.</p>
        </div>
      }

      <ion-infinite-scroll (ionInfinite)="loadMore($event)" [disabled]="!hasMore()">
        <ion-infinite-scroll-content loadingText="Loading more..."></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [`
    .meta-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-top: 0.25rem;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
    .placeholder-thumb {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-light);
      font-size: 2rem;
      color: var(--ion-color-medium);
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
    }
  `],
})
export class HighlightsPage implements OnInit {
  highlights = signal<Highlight[]>([]);
  loading = signal(false);
  hasMore = signal(true);
  page = 1;
  searchQuery = '';

  private apiUrl = `${environment.apiBaseUrl}/highlights`;

  constructor(private http: HttpClient) {
    addIcons({ playCircleOutline, eyeOutline, timeOutline });
  }

  ngOnInit(): void {
    this.loadHighlights();
  }

  loadHighlights(append = false): void {
    this.loading.set(true);
    const url = this.searchQuery
      ? `${this.apiUrl}/search?q=${encodeURIComponent(this.searchQuery)}`
      : `${this.apiUrl}?page=${this.page}&limit=20`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const items: Highlight[] = Array.isArray(res) ? res : res.data || [];
        if (append) {
          this.highlights.update((prev) => [...prev, ...items]);
        } else {
          this.highlights.set(items);
        }
        this.hasMore.set(items.length >= 20);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: any): void {
    this.searchQuery = event.detail.value || '';
    this.page = 1;
    this.loadHighlights();
  }

  refresh(event: any): void {
    this.page = 1;
    this.loadHighlights();
    event.target.complete();
  }

  loadMore(event: any): void {
    this.page++;
    this.loadHighlights(true);
    event.target.complete();
  }

  openVideo(h: Highlight): void {
    // Record view
    this.http.post(`${this.apiUrl}/${h.id}/view`, {}).subscribe();
    // Open in external browser
    window.open(h.videoUrl, '_blank');
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '–';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
