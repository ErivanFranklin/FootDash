import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent, IonItem, IonLabel, IonInput, IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonChip } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/services/api.service';
import { PageHeaderComponent, MatchCardComponent, FormSectionComponent, MatchSkeletonComponent } from '../../../shared/components';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-matches',
  standalone: true,
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonLabel, IonInput, IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonChip, PageHeaderComponent, MatchCardComponent, FormSectionComponent, MatchSkeletonComponent, RouterModule, TranslocoPipe]
})
export class MatchesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastController);

  teamId!: number;
  // Football seasons span two calendar years (e.g. 2024-2025).
  // Before August, the current season started the previous year.
  // Free API plan caps at 2024, so use min(computed, 2024).
  season = Math.min(
    new Date().getMonth() < 7
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
    2024
  );
  range = 'recent';
  limit: number | null = 10;
  from: string | null = null; // YYYY-MM-DD
  to: string | null = null;   // YYYY-MM-DD
  fixtures: any[] = [];
  allFixtures: any[] = [];  // full dataset for client-side pagination
  loading = false;
  currentPage = 0;
  hasMoreData = true;
  pageSize = 10;
  quickFilters = [
    { label: 'Today', value: 'today', icon: 'calendar-outline', active: false },
    { label: 'Live', value: 'live', icon: 'pulse-outline', active: false },
    { label: 'Upcoming', value: 'upcoming', icon: 'time-outline', active: false }
  ];

  ngOnInit() {
    const param = this.route.snapshot.paramMap.get('teamId');
    this.teamId = Number(param);
    this.loadMatches();
  }

  loadMatches() {
    if (!this.teamId) return;
    this.loading = true;
    this.api.getTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined, from: this.from || undefined, to: this.to || undefined }).subscribe({
      next: (res) => {
        this.allFixtures = Array.isArray(res) ? res : (res?.data || res?.matches || []);
        this.currentPage = 0;
        this.fixtures = this.allFixtures.slice(0, this.pageSize);
        this.hasMoreData = this.allFixtures.length > this.pageSize;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Failed to load fixtures', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }

  async syncFixtures() {
    if (!this.teamId) return;
    this.loading = true;
    this.api.syncTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined, from: this.from || undefined, to: this.to || undefined }).subscribe({
      next: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Fixture sync complete', duration: 1500, color: 'success' });
        t.present();
        this.loadMatches();
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Fixture sync failed', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }

  handleRefresh(event: any) {
    this.loadMatches();
    // Complete the refresh after data loads
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  loadMoreMatches(event: any) {
    if (!this.hasMoreData) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    const offset = this.currentPage * this.pageSize;
    const nextPage = this.allFixtures.slice(offset, offset + this.pageSize);

    if (nextPage.length === 0) {
      this.hasMoreData = false;
    } else {
      this.fixtures = [...this.fixtures, ...nextPage];
      this.hasMoreData = offset + this.pageSize < this.allFixtures.length;
    }

    event.target.complete();
  }

  toggleQuickFilter(filter: any) {
    // Toggle the clicked filter
    filter.active = !filter.active;
    
    // Deactivate other filters (only one active at a time)
    this.quickFilters.forEach(f => {
      if (f !== filter) f.active = false;
    });

    // Apply the filter
    this.applyQuickFilter();
  }

  private applyQuickFilter() {
    const activeFilter = this.quickFilters.find(f => f.active);
    
    if (!activeFilter) {
      // No filter active, reload all matches
      this.range = 'recent';
      this.loadMatches();
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (activeFilter.value) {
      case 'today':
        this.from = todayStr;
        this.to = todayStr;
        this.range = 'all';
        break;
      case 'live':
        this.range = 'recent';
        // In a real app, this would filter by status='LIVE'
        break;
      case 'upcoming':
        this.range = 'upcoming';
        this.from = todayStr;
        this.to = null;
        break;
    }

    this.loadMatches();
  }
}
