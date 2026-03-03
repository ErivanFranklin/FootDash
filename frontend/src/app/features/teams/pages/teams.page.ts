import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonList, IonItem, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent, InfiniteScrollCustomEvent, IonSegment, IonSegmentButton, IonLabel, SegmentCustomEvent } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { FavoritesService } from '../../../services/favorites.service';
import { PageHeaderComponent, TeamCardComponent } from '../../../shared/components';

@Component({
  selector: 'app-teams',
  standalone: true,
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  imports: [CommonModule, IonContent, PageHeaderComponent, TeamCardComponent, IonList, IonItem, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent, IonSegment, IonSegmentButton, IonLabel]
})
export class TeamsPage implements OnInit {
  private api = inject(ApiService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);
  private toast = inject(ToastController);

  teams: any[] = [];
  favoriteTeams: any[] = [];
  loading = false;
  syncingTeamIds = new Set<number>();
  filterMode: 'all' | 'favorites' = 'all';

  // Pagination state
  currentPage = 1;
  pageSize = 20;
  totalTeams = 0;
  hasMoreData = true;

  ngOnInit() {
    this.loadTeams();
  }

  get visibleTeams(): any[] {
    return this.filterMode === 'favorites' ? this.favoriteTeams : this.teams;
  }

  loadTeams(page = 1) {
    this.loading = true;
    this.api.getTeams({ page, limit: this.pageSize }).subscribe({
      next: (res) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        const total = res?.total ?? data.length;

        if (page === 1) {
          this.teams = data;
        } else {
          this.teams = [...this.teams, ...data];
        }

        this.currentPage = page;
        this.totalTeams = total;
        this.hasMoreData = this.teams.length < total;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Failed to load teams', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }

  refreshTeams() {
    this.currentPage = 1;
    if (this.filterMode === 'favorites') {
      this.loadFavoriteTeams();
      return;
    }
    this.loadTeams(1);
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    if (this.filterMode === 'favorites') {
      event.target.complete();
      return;
    }

    if (!this.hasMoreData) {
      event.target.complete();
      return;
    }
    const nextPage = this.currentPage + 1;
    this.api.getTeams({ page: nextPage, limit: this.pageSize }).subscribe({
      next: (res) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        const total = res?.total ?? this.totalTeams;

        this.teams = [...this.teams, ...data];
        this.currentPage = nextPage;
        this.totalTeams = total;
        this.hasMoreData = this.teams.length < total;
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      }
    });
  }

  onFilterChange(event: SegmentCustomEvent) {
    const mode = (event.detail.value || 'all') as 'all' | 'favorites';
    this.filterMode = mode;

    if (mode === 'favorites') {
      this.loadFavoriteTeams();
      return;
    }

    if (!this.teams.length) {
      this.loadTeams(1);
    }
  }

  loadFavoriteTeams() {
    this.loading = true;

    this.favoritesService.loadFavorites('team').subscribe({
      next: (favorites) => {
        const favoriteIds = Array.from(new Set((favorites || []).map((fav) => Number(fav.entityId)).filter((id) => Number.isFinite(id))));

        if (!favoriteIds.length) {
          this.favoriteTeams = [];
          this.loading = false;
          return;
        }

        const requests = favoriteIds.map((id) =>
          this.api.getTeam(id).pipe(catchError(() => of(null))),
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            this.favoriteTeams = results
              .map((item: any) => item?.data ?? item)
              .filter((item: any) => !!item);
            this.loading = false;
          },
          error: async () => {
            this.favoriteTeams = [];
            this.loading = false;
            const t = await this.toast.create({ message: 'Failed to load favorite teams', duration: 2000, color: 'danger' });
            t.present();
          },
        });
      },
      error: async () => {
        this.favoriteTeams = [];
        this.loading = false;
        const t = await this.toast.create({ message: 'Failed to load favorite teams', duration: 2000, color: 'danger' });
        t.present();
      },
    });
  }

  trackByTeamId(_index: number, team: any): number {
    return this.resolveTeamId(team) ?? _index;
  }

  resolveTeamId(team: any): number | null {
    const id = team?.id ?? team?.teamId ?? team?.externalId ?? team?.team?.id;
    return id != null ? Number(id) : null;
  }

  getTeamActions(team: any) {
    const teamId = this.resolveTeamId(team);
    return [
      { label: 'View Matches', handler: this.viewMatches.bind(this), icon: 'eye' },
      { label: 'View Analytics', handler: this.viewAnalytics.bind(this), icon: 'stats-chart', color: 'secondary' },
      { label: 'Sync Team', handler: this.syncTeam.bind(this), icon: 'sync', color: 'medium', loading: teamId != null && this.syncingTeamIds.has(teamId) }
    ];
  }

  viewMatches(team: any) {
    const id = this.resolveTeamId(team);
    if (id == null) return;
    this.router.navigate(['/matches', id]);
  }

  viewAnalytics(team: any) {
    const id = this.resolveTeamId(team);
    if (id == null) return;
    this.router.navigate(['/analytics/team', id]);
  }

  async syncTeam(team: any) {
    const id = this.resolveTeamId(team);
    if (id == null) return;
    this.syncingTeamIds.add(id);
    this.api.syncTeam(id).subscribe({
      next: async () => {
        this.syncingTeamIds.delete(id);
        const t = await this.toast.create({ message: 'Team sync complete', duration: 1500, color: 'success' });
        t.present();
        this.loadTeams();
      },
      error: async () => {
        this.syncingTeamIds.delete(id);
        const t = await this.toast.create({ message: 'Team sync failed', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }
}
