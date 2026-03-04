import { Component, inject, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSpinner, IonButtons, IonMenuButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonBadge, IonAvatar, IonChip } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatchCardComponent, StatCardComponent } from '../../../shared/components';
import { FavoriteButtonComponent } from '../../../components/favorite-button/favorite-button.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { LoggerService } from '../../../core/services/logger.service';
import { AuthService } from '../../../core/services/auth.service';
import { Match, Team } from '../../../models/domain.model';

interface DashboardData {
  favoriteTeams: Team[];
  recentResults: Match[];
  upcomingMatches: Match[];
  allRecentMatches: Match[];
  hasFavorites: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSpinner,
    IonButtons, IonMenuButton, IonIcon, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonText, IonBadge, IonAvatar, IonChip,
    MatchCardComponent, StatCardComponent, FavoriteButtonComponent,
    TranslocoPipe,
  ],
})
export class HomePage implements OnInit {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private authService = inject(AuthService);

  dashboard: DashboardData | null = null;
  loading = true;
  isLoggedIn = false;

  ngOnInit() {
    this.isLoggedIn = !!this.authService.getToken();
    if (this.isLoggedIn) {
      this.loadDashboard();
    } else {
      this.loading = false;
    }
  }

  ionViewWillEnter() {
    this.isLoggedIn = !!this.authService.getToken();
    if (this.isLoggedIn) {
      this.loadDashboard();
    } else {
      this.dashboard = null;
      this.loading = false;
    }
  }

  loadDashboard() {
    this.loading = true;
    this.http.get<DashboardData>(`${environment.apiBaseUrl}/dashboard`).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err) => {
        this.logger.error('Failed to load dashboard', err);
        this.loading = false;
      },
    });
  }

  getMatchScore(match: Match): string {
    if (match.homeScore != null && match.awayScore != null) {
      return `${match.homeScore} - ${match.awayScore}`;
    }
    return 'vs';
  }

  getTeamInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}
