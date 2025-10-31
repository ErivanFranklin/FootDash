

import { Routes } from '@angular/router';
import { authGuard } from './services/auth-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/teams.page').then((m) => m.TeamsPage),
    canActivate: [authGuard],
  },
  {
    path: 'matches/:teamId',
    loadComponent: () => import('./matches/matches.page').then((m) => m.MatchesPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
