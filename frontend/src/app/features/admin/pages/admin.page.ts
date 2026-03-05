import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminStats, AdminUser } from '../../../core/services/admin.service';
import { AdminAnalyticsComponent } from '../components/admin-analytics.component';

type RoleFilter = '' | 'USER' | 'MODERATOR' | 'ADMIN';
type ProFilter = '' | 'true' | 'false';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonChip,
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    AdminAnalyticsComponent,
  ],
  styles: [`
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 16px;
    }
    .filter-row ion-chip {
      --background: var(--ion-color-light);
      cursor: pointer;
    }
    .filter-row ion-chip.active {
      --background: var(--ion-color-primary);
      --color: #fff;
    }
    .filter-row ion-chip.active-danger {
      --background: var(--ion-color-danger);
      --color: #fff;
    }
    .filter-row ion-chip.active-warning {
      --background: var(--ion-color-warning);
      --color: #000;
    }
    .filter-row ion-chip.active-success {
      --background: var(--ion-color-success);
      --color: #fff;
    }
    .filter-row ion-chip.active-medium {
      --background: var(--ion-color-medium);
      --color: #fff;
    }
    .user-card {
      --padding-start: 16px;
      --padding-end: 16px;
    }
    .user-badges {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 16px 8px;
    }
    .stat-card {
      text-align: center;
      padding: 12px 8px;
      border-radius: 12px;
      background: var(--ion-color-light);
    }
    .stat-card h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .stat-card p {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    .count-label {
      font-size: 13px;
      color: var(--ion-color-medium);
      padding: 4px 16px;
    }
    .updating-indicator {
      display: inline-block;
      margin-left: 8px;
    }
  `],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="activeTab" (ionChange)="activeTab = $event.detail.value?.toString() || 'users'">
          <ion-segment-button value="users">
            <ion-label>Users</ion-label>
          </ion-segment-button>
          <ion-segment-button value="analytics">
            <ion-label>Analytics</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-top">
      @if (activeTab === 'analytics') {
        <app-admin-analytics></app-admin-analytics>
      } @else {
      @if (loading) {
        <div style="text-align:center;padding:40px">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else {
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>{{ stats?.totalUsers ?? 0 }}</h3>
            <p>Total Users</p>
          </div>
          <div class="stat-card">
            <h3>{{ stats?.totalAdmins ?? 0 }}</h3>
            <p>Admins</p>
          </div>
          <div class="stat-card">
            <h3>{{ stats?.totalProUsers ?? 0 }}</h3>
            <p>Pro Users</p>
          </div>
          <div class="stat-card">
            <h3>{{ stats?.newUsersLast7Days ?? 0 }}</h3>
            <p>New (7 days)</p>
          </div>
        </div>

        <!-- Search input -->
        <ion-item>
          <ion-input
            label="Search users"
            labelPlacement="stacked"
            [(ngModel)]="search"
            placeholder="Type to search by email, name, or ID..."
            (ionInput)="onSearchInput()"
            (keyup.enter)="applyFilters()"
          ></ion-input>
          @if (search) {
            <ion-button
              slot="end"
              fill="clear"
              size="small"
              (click)="clearSearch()"
            >Clear</ion-button>
          }
        </ion-item>

        <!-- Role filter chips -->
        <div class="filter-row">
          <span style="font-size:12px;color:var(--ion-color-medium);align-self:center">Role:</span>
          <ion-chip
            [class.active]="roleFilter === ''"
            (click)="setRoleFilter('')"
          >All</ion-chip>
          <ion-chip
            [class.active-medium]="roleFilter === 'USER'"
            (click)="setRoleFilter('USER')"
          >USER</ion-chip>
          <ion-chip
            [class.active-warning]="roleFilter === 'MODERATOR'"
            (click)="setRoleFilter('MODERATOR')"
          >MODERATOR</ion-chip>
          <ion-chip
            [class.active-danger]="roleFilter === 'ADMIN'"
            (click)="setRoleFilter('ADMIN')"
          >ADMIN</ion-chip>
        </div>

        <!-- Pro filter chips -->
        <div class="filter-row">
          <span style="font-size:12px;color:var(--ion-color-medium);align-self:center">Plan:</span>
          <ion-chip
            [class.active]="proFilter === ''"
            (click)="setProFilter('')"
          >All</ion-chip>
          <ion-chip
            [class.active-success]="proFilter === 'true'"
            (click)="setProFilter('true')"
          >PRO</ion-chip>
          <ion-chip
            [class.active-medium]="proFilter === 'false'"
            (click)="setProFilter('false')"
          >FREE</ion-chip>
        </div>

        <!-- Counter -->
        <div class="count-label">
          Showing {{ users.length }} of {{ totalUsers }} users
          @if (loadingUsers) {
            <ion-spinner name="dots" class="updating-indicator" style="width:16px;height:16px"></ion-spinner>
          }
        </div>

        <!-- User list -->
        <ion-list>
          @for (user of users; track user.id) {
            <ion-item class="user-card">
              <ion-label>
                <h2>{{ user.email }}</h2>
                <p>ID: {{ user.id }} · Created: {{ user.createdAt | date:'short' }}</p>
                <div class="user-badges">
                  <ion-badge [color]="roleColor(user.role)">{{ user.role }}</ion-badge>
                  <ion-badge [color]="user.isPro ? 'success' : 'medium'">{{ user.isPro ? 'PRO' : 'FREE' }}</ion-badge>
                </div>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-select
                label="Role"
                labelPlacement="stacked"
                [value]="user.role"
                (ionChange)="onRoleChange(user, $event.detail.value)"
              >
                <ion-select-option value="USER">USER</ion-select-option>
                <ion-select-option value="MODERATOR">MODERATOR</ion-select-option>
                <ion-select-option value="ADMIN">ADMIN</ion-select-option>
              </ion-select>
              <ion-toggle
                [checked]="user.isPro"
                (ionChange)="onProChange(user, $event.detail.checked)"
              >Pro</ion-toggle>
            </ion-item>
          }
        </ion-list>

        @if (users.length === 0 && !loadingUsers) {
          <div style="text-align:center;padding:32px;color:var(--ion-color-medium)">
            No users match your search.
          </div>
        }

        <ion-infinite-scroll
          threshold="200px"
          [disabled]="!hasMore || loadingUsers"
          (ionInfinite)="loadMoreUsers($event)"
        >
          <ion-infinite-scroll-content
            loadingSpinner="bubbles"
            loadingText="Loading more users..."
          ></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }
      }
    </ion-content>
  `,
})
export class AdminPage implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toastController = inject(ToastController);

  // Debounce subject for search-as-you-type
  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  loading = false;
  loadingUsers = false;
  activeTab: string = 'users';
  stats: AdminStats | null = null;
  users: AdminUser[] = [];
  totalUsers = 0;
  search = '';
  roleFilter: RoleFilter = '';
  proFilter: ProFilter = '';

  readonly pageSize = 50;
  offset = 0;
  hasMore = true;

  ngOnInit(): void {
    // Debounce search input — fires 350ms after user stops typing
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    this.loadAll();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput() {
    this.searchSubject.next(this.search);
  }

  clearSearch() {
    this.search = '';
    this.applyFilters();
  }

  setRoleFilter(role: RoleFilter) {
    this.roleFilter = role;
    this.applyFilters();
  }

  setProFilter(pro: ProFilter) {
    this.proFilter = pro;
    this.applyFilters();
  }

  loadAll() {
    this.loading = true;
    this.adminService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.totalUsers = stats.totalUsers;
        this.applyFilters(true);
      },
      error: async () => {
        this.loading = false;
        const toast = await this.toastController.create({
          message: 'Failed to load admin stats',
          color: 'danger',
          duration: 2500,
        });
        await toast.present();
      },
    });
  }

  applyFilters(isInitial = false) {
    this.offset = 0;
    this.hasMore = true;
    this.users = [];
    this.loadUsers(isInitial);
  }

  loadUsers(skipLoading = false, event?: any) {
    if (!skipLoading) {
      this.loadingUsers = true;
    }

    this.adminService
      .listUsers(this.pageSize, this.offset, this.search, this.roleFilter, this.proFilter)
      .subscribe({
        next: res => {
          this.totalUsers = res.total;
          this.users = this.offset === 0 ? res.items : [...this.users, ...res.items];
          this.offset += res.items.length;
          this.hasMore = this.users.length < res.total && res.items.length > 0;
          this.loadingUsers = false;
          this.loading = false;
          event?.target?.complete();
        },
        error: async () => {
          this.loadingUsers = false;
          this.loading = false;
          event?.target?.complete();
          const toast = await this.toastController.create({
            message: 'Failed to load users',
            color: 'danger',
            duration: 2500,
          });
          await toast.present();
        },
      });
  }

  loadMoreUsers(event: any) {
    if (this.loadingUsers || !this.hasMore) {
      event?.target?.complete();
      return;
    }
    this.loadUsers(true, event);
  }

  /** Re-fetch stats so counters update after role/pro changes */
  private refreshStats() {
    this.adminService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
      },
      error: () => {},
    });
  }

  /** Re-fetch currently loaded window so the list reflects changes */
  private refreshCurrentWindow() {
    const size = Math.max(this.users.length, this.pageSize);
    this.loadingUsers = true;
    this.adminService
      .listUsers(size, 0, this.search, this.roleFilter, this.proFilter)
      .subscribe({
        next: res => {
          this.users = res.items;
          this.totalUsers = res.total;
          this.offset = res.items.length;
          this.hasMore = this.users.length < res.total && res.items.length > 0;
          this.loadingUsers = false;
        },
        error: () => {
          this.loadingUsers = false;
        },
      });
  }

  roleColor(role: AdminUser['role']): string {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'MODERATOR':
        return 'warning';
      default:
        return 'medium';
    }
  }

  onRoleChange(user: AdminUser, role: 'USER' | 'ADMIN' | 'MODERATOR') {
    if (role === user.role) return; // no-op
    this.adminService.updateUserRole(user.id, role).subscribe({
      next: updated => {
        user.role = updated.role;
        this.refreshStats();
        this.refreshCurrentWindow();
        this.showToast(`Role updated to ${updated.role}`, 'success');
      },
      error: async (err) => {
        const msg = err?.error?.message || 'Failed to update role';
        this.showToast(msg, 'danger');
      },
    });
  }

  onProChange(user: AdminUser, isPro: boolean) {
    if (isPro === user.isPro) return; // no-op
    this.adminService.updateUserPro(user.id, isPro).subscribe({
      next: updated => {
        user.isPro = updated.isPro;
        this.refreshStats();
        this.refreshCurrentWindow();
        this.showToast(`Pro status: ${updated.isPro ? 'enabled' : 'disabled'}`, 'success');
      },
      error: async () => {
        this.showToast('Failed to update Pro status', 'danger');
      },
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
