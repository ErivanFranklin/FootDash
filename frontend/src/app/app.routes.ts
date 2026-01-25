import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { proGuard } from './core/guards/pro.guard';

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
    canActivate: [authGuard, proGuard],
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
    path: 'leaderboard',
    loadComponent: () => import('./features/gamification/pages/leaderboard.page').then(m => m.LeaderboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'pro',
    loadComponent: () => import('./features/subscription/pages/pro-page/pro-page.component').then(m => m.ProPage),
    canActivate: [authGuard],
  },
  {
    path: 'payments/success',
    loadComponent: () => import('./features/subscription/pages/payment-success.page').then(m => m.PaymentSuccessPage),
    canActivate: [authGuard],
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
