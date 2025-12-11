import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/dashboard/pages/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'teams',
    loadComponent: () => import('./features/teams/pages/teams.page').then((m) => m.TeamsPage),
    canActivate: [authGuard],
  },
  {
    path: 'matches/:teamId',
    loadComponent: () => import('./features/matches/pages/matches.page').then((m) => m.MatchesPage),
    canActivate: [authGuard],
  },
  {
    path: 'match/:matchId',
    loadComponent: () => import('./features/matches/pages/match-details.page').then(m => m.MatchDetailsPage),
    canActivate: [authGuard],
  },
  {
    path: 'analytics/match/:matchId',
    loadComponent: () => import('./features/analytics/pages/match-prediction.page').then(m => m.MatchPredictionPage),
    canActivate: [authGuard],
  },
  {
    path: 'analytics/team/:teamId',
    loadComponent: () => import('./features/analytics/pages/team-analytics.page').then(m => m.TeamAnalyticsPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'user-profile/:id',
    loadComponent: () => import('./features/social/user-profile/user-profile.page').then( m => m.UserProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'feed',
    loadComponent: () => import('./features/social/feed/feed.page').then( m => m.FeedPage),
    canActivate: [authGuard],
  },
  {
    path: 'match-discussion/:id',
    loadComponent: () => import('./features/social/match-discussion/match-discussion.page').then( m => m.MatchDiscussionPage),
    canActivate: [authGuard],
  },
];
