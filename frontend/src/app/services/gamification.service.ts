import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = `${environment.apiBaseUrl}/gamification`;

  constructor(private http: HttpClient) {}

  submitPrediction(matchId: number, homeScore: number, awayScore: number): Observable<UserPrediction> {
    return this.http.post<UserPrediction>(`${this.apiUrl}/predict`, {
      matchId,
      homeScore,
      awayScore
    });
  }

  getLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'weekly'): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/leaderboard?period=${period}`);
  }
}
