import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  PredictionResult,
  TeamAnalytics,
  TeamForm,
  TeamComparison,
} from '../models/analytics.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/analytics`;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for predictions
  private readonly ANALYTICS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for analytics

  private http = inject(HttpClient);

  /**
   * Get prediction for a specific match
   */
  getMatchPrediction(matchId: number): Observable<PredictionResult> {
    const cacheKey = `prediction_${matchId}`;
    const cached = this.getFromCache(cacheKey, this.CACHE_DURATION);
    
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<PredictionResult>(`${this.apiUrl}/match/${matchId}/prediction`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((data) => this.saveToCache(cacheKey, data)),
        catchError(this.handleError<PredictionResult>('getMatchPrediction'))
      );
  }

  /**
   * Generate a new prediction for a match
   */
  generatePrediction(matchId: number): Observable<PredictionResult> {
    const cacheKey = `prediction_${matchId}`;
    
    return this.http
      .post<PredictionResult>(
        `${this.apiUrl}/match/${matchId}/predict`,
        {},
        { headers: this.getHeaders() }
      )
      .pipe(
        tap((data) => this.saveToCache(cacheKey, data)),
        catchError(this.handleError<PredictionResult>('generatePrediction'))
      );
  }

  /**
   * Get predictions for upcoming matches
   */
  getUpcomingPredictions(days: number = 7): Observable<PredictionResult[]> {
    return this.http
      .get<PredictionResult[]>(`${this.apiUrl}/upcoming-predictions`, {
        headers: this.getHeaders(),
        params: { days: days.toString() },
      })
      .pipe(
        catchError(this.handleError<PredictionResult[]>('getUpcomingPredictions', []))
      );
  }

  /**
   * Get team analytics
   */
  getTeamAnalytics(teamId: number): Observable<TeamAnalytics> {
    const cacheKey = `analytics_${teamId}`;
    const cached = this.getFromCache(cacheKey, this.ANALYTICS_CACHE_DURATION);
    
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<TeamAnalytics>(`${this.apiUrl}/team/${teamId}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap((data) => this.saveToCache(cacheKey, data)),
        catchError(this.handleError<TeamAnalytics>('getTeamAnalytics'))
      );
  }

  /**
   * Get team form data
   */
  getTeamForm(teamId: number, lastN: number = 5): Observable<TeamForm> {
    return this.http
      .get<TeamForm>(`${this.apiUrl}/team/${teamId}/form`, {
        headers: this.getHeaders(),
        params: { lastN: lastN.toString() },
      })
      .pipe(
        catchError(this.handleError<TeamForm>('getTeamForm'))
      );
  }

  /**
   * Compare two teams
   */
  compareTeams(homeTeamId: number, awayTeamId: number): Observable<TeamComparison> {
    const cacheKey = `compare_${homeTeamId}_${awayTeamId}`;
    const cached = this.getFromCache(cacheKey, this.ANALYTICS_CACHE_DURATION);
    
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<TeamComparison>(`${this.apiUrl}/team/compare`, {
        headers: this.getHeaders(),
        params: {
          homeTeamId: homeTeamId.toString(),
          awayTeamId: awayTeamId.toString(),
        },
      })
      .pipe(
        tap((data) => this.saveToCache(cacheKey, data)),
        catchError(this.handleError<TeamComparison>('compareTeams'))
      );
  }

  /**
   * Refresh all analytics (admin function)
   */
  refreshAllAnalytics(): Observable<{ message: string; updated: number }> {
    this.clearCache(); // Clear cache when refreshing
    
    return this.http
      .post<{ message: string; updated: number }>(
        `${this.apiUrl}/team/refresh-all`,
        {},
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError(this.handleError<{ message: string; updated: number }>('refreshAllAnalytics'))
      );
  }

  /**
   * Get confidence badge color
   */
  getConfidenceColor(confidence: 'low' | 'medium' | 'high'): string {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Get confidence badge text
   */
  getConfidenceText(confidence: 'low' | 'medium' | 'high'): string {
    switch (confidence) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get the most likely outcome
   */
  getMostLikelyOutcome(prediction: PredictionResult): {
    outcome: string;
    probability: number;
  } {
    const { homeWinProbability, drawProbability, awayWinProbability, homeTeam, awayTeam } = prediction;
    
    if (homeWinProbability > drawProbability && homeWinProbability > awayWinProbability) {
      return { outcome: `${homeTeam} Win`, probability: homeWinProbability };
    }
    if (awayWinProbability > homeWinProbability && awayWinProbability > drawProbability) {
      return { outcome: `${awayTeam} Win`, probability: awayWinProbability };
    }
    return { outcome: 'Draw', probability: drawProbability };
  }

  /**
   * Format form string for display (e.g., "WDLWW" -> "W-D-L-W-W")
   */
  formatFormString(form: string): string {
    return form.split('').join('-');
  }

  /**
   * Get form badge color
   */
  getFormBadgeColor(result: 'W' | 'D' | 'L'): string {
    switch (result) {
      case 'W':
        return 'success';
      case 'D':
        return 'warning';
      case 'L':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Private helper methods

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  private getFromCache(key: string, maxAge: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result
      if (result !== undefined) {
        return of(result as T);
      }
      
      return throwError(() => error);
    };
  }
}
