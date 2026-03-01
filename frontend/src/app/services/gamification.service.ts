import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserPrediction {
  id?: number;
  userId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
  points?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  points: number;
  avatarUrl?: string;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeResponse {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  slug: string;
  tier: BadgeTier;
  criteriaType: string;
  threshold: number;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

export interface PredictionWithBadges {
  prediction: UserPrediction;
  newBadges: BadgeResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = `${environment.apiBaseUrl}/gamification`;
  private http = inject(HttpClient);

  constructor() {}

  submitPrediction(matchId: number, homeScore: number, awayScore: number): Observable<PredictionWithBadges> {
    return this.http.post<PredictionWithBadges>(`${this.apiUrl}/predict`, {
      matchId,
      homeScore,
      awayScore
    });
  }

  getLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'weekly'): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/leaderboard?period=${period}`);
  }

  /** Get all badges with unlock state for the current user */
  getAllBadges(): Observable<BadgeResponse[]> {
    return this.http.get<BadgeResponse[]>(`${this.apiUrl}/badges`);
  }

  /** Get badges unlocked by a specific user */
  getUserBadges(userId: number): Observable<BadgeResponse[]> {
    return this.http.get<BadgeResponse[]>(`${this.apiUrl}/badges/user/${userId}`);
  }

  /** Trigger a badge check for the current user */
  checkBadges(): Observable<BadgeResponse[]> {
    return this.http.post<BadgeResponse[]>(`${this.apiUrl}/badges/check`, {});
  }
}
