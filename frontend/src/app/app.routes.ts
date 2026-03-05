import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { proGuard } from './core/guards/pro.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    path: 'analytics/predictions',
    loadComponent: () => import('./features/analytics/pages/prediction-analytics.page').then(m => m.PredictionAnalyticsPage),
    canActivate: [authGuard],
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/analytics/pages/team-compare.page').then(m => m.TeamComparePage),
    canActivate: [authGuard],
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/pages/onboarding.page').then((m) => m.OnboardingPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/pages/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.page').then((m) => m.NotificationsPage),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
    canActivate: [authGuard],
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search-results.page').then((m) => m.SearchResultsPage),
    canActivate: [authGuard],
  },
  {
    path: '404',
    loadComponent: () => import('./features/error/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: 'error',
    loadComponent: () => import('./features/error/error.page').then((m) => m.ErrorPage),
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./features/gamification/pages/leaderboard/leaderboard.page').then(m => m.LeaderboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'badges',
    loadComponent: () => import('./features/gamification/pages/badges/badges.page').then(m => m.BadgesPage),
    canActivate: [authGuard],
  },
  {
    path: 'export',
    loadComponent: () => import('./features/export/export.page').then(m => m.ExportPage),
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
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin.page').then(m => m.AdminPage),
    canActivate: [authGuard, adminGuard],
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
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'match-discussion/:id',
    loadComponent: () => import('./features/social/match-discussion/match-discussion.page').then( m => m.MatchDiscussionPage),
    canActivate: [authGuard],
  },
  {
    path: 'leagues',
    loadComponent: () => import('./features/leagues/pages/leagues.page').then(m => m.LeaguesPage),
    canActivate: [authGuard],
  },
  {
    path: 'leagues/:id/standings',
    loadComponent: () => import('./features/leagues/pages/league-standings.page').then(m => m.LeagueStandingsPage),
    canActivate: [authGuard],
  },
  {
    path: 'fantasy',
    loadComponent: () => import('./features/fantasy/pages/fantasy-home.page').then(m => m.FantasyHomePage),
    canActivate: [authGuard],
  },
  {
    path: 'fantasy/league/:id',
    loadComponent: () => import('./features/fantasy/pages/fantasy-league.page').then(m => m.FantasyLeaguePage),
    canActivate: [authGuard],
  },
  {
    path: 'fantasy/league/:id/team/:teamId',
    loadComponent: () => import('./features/fantasy/pages/fantasy-team.page').then(m => m.FantasyTeamPage),
    canActivate: [authGuard],
  },
  {
    path: 'highlights',
    loadComponent: () => import('./features/highlights/pages/highlights.page').then(m => m.HighlightsPage),
    canActivate: [authGuard],
  },
  {
    path: 'odds',
    loadComponent: () => import('./features/odds/pages/odds.page').then(m => m.OddsPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
