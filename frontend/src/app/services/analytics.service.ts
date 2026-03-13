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
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/analytics`;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for predictions
  private readonly ANALYTICS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for analytics

  private http = inject(HttpClient);
  private logger = inject(LoggerService);

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
  getUpcomingPredictions(limit: number = 7): Observable<PredictionResult[]> {
    return this.http
      .get<PredictionResult[]>(`${this.apiUrl}/upcoming-predictions`, {
        headers: this.getHeaders(),
        params: { limit: limit.toString() },
      })
      .pipe(
        catchError(this.handleError<PredictionResult[]>('getUpcomingPredictions', []))
      );
  }

  /**
   * Get prediction performance statistics
   */
  getPredictionStats(strategy?: string, limit: number = 100): Observable<any> {
    const params: any = { limit: limit.toString() };
    if (strategy) params.strategy = strategy;
    return this.http
      .get<any>(`${this.apiUrl}/predictions/stats`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(catchError(this.handleError('getPredictionStats', null)));
  }

  getBttsPrediction(matchId: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/match/${matchId}/prediction/btts`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError('getBttsPrediction', {
        btts_yes_probability: 0.5,
        btts_no_probability: 0.5,
        confidence: 'low',
        model_version: 'fallback',
      })));
  }

  getOverUnderPrediction(matchId: number, line = 2.5): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/match/${matchId}/prediction/over-under`, {
        headers: this.getHeaders(),
        params: { line: String(line) },
      })
      .pipe(catchError(this.handleError('getOverUnderPrediction', {
        over_probability: 0.5,
        under_probability: 0.5,
        line: 2.5,
        confidence: 'low',
        model_version: 'fallback',
      })));
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
        map((data) => this.normalizeTeamAnalytics(data)),
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
          team1: homeTeamId.toString(),
          team2: awayTeamId.toString(),
        },
      })
      .pipe(
        map((data) => this.normalizeComparison(data)),
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
    return confidence.toUpperCase();
  }

  /**
   * Get the most likely outcome
   */
  getMostLikelyOutcome(prediction: PredictionResult): {
    type: 'home' | 'away' | 'draw';
    probability: number;
  } {
    const { homeWinProbability, drawProbability, awayWinProbability } = prediction;
    
    if (homeWinProbability > drawProbability && homeWinProbability > awayWinProbability) {
      return { type: 'home', probability: homeWinProbability };
    }
    if (awayWinProbability > homeWinProbability && awayWinProbability > drawProbability) {
      return { type: 'away', probability: awayWinProbability };
    }
    return { type: 'draw', probability: drawProbability };
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
    // Remove auth requirement for basic analytics - now public
    return new HttpHeaders({
      'Content-Type': 'application/json',
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
      this.logger.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result
      if (result !== undefined) {
        return of(result as T);
      }
      
      return throwError(() => error);
    };
  }

  /** Safely coerce a value to number, defaulting to 0 */
  private num(val: any): number {
    const n = Number(val);
    return isFinite(n) ? n : 0;
  }

  /** Normalize a PerformanceStats object from the API (handles missing + renamed fields) */
  private normalizePerformanceStats(raw: any): any {
    if (!raw || typeof raw !== 'object') {
      return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, winPercentage: 0 };
    }
    const played = this.num(raw.played ?? ((this.num(raw.wins ?? raw.won)) + (this.num(raw.draws ?? raw.drawn)) + (this.num(raw.losses ?? raw.lost))));
    const won = this.num(raw.won ?? raw.wins);
    const drawn = this.num(raw.drawn ?? raw.draws);
    const lost = this.num(raw.lost ?? raw.losses);
    const goalsFor = this.num(raw.goalsFor ?? raw.goalsScored);
    const goalsAgainst = this.num(raw.goalsAgainst ?? raw.goalsConceded);
    const goalDifference = this.num(raw.goalDifference ?? (goalsFor - goalsAgainst));
    const points = this.num(raw.points ?? (won * 3 + drawn));
    const winPercentage = this.num(raw.winPercentage || (played > 0 ? (won / played) * 100 : 0));
    return { played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points, winPercentage };
  }

  /** Normalize a TeamAnalytics object from the API */
  private normalizeTeamAnalytics(raw: any): TeamAnalytics {
    if (!raw) {
      return raw;
    }
    const scoringTrend = raw.scoringTrend ? {
      last5Matches: raw.scoringTrend.last5Matches ?? raw.scoringTrend.last5 ?? [],
      average: this.num(raw.scoringTrend.average),
      trend: raw.scoringTrend.trend ?? 'stable',
    } : { last5Matches: [], average: 0, trend: 'stable' as const };

    return {
      ...raw,
      formRating: this.num(raw.formRating),
      defensiveRating: this.num(raw.defensiveRating),
      overallStats: this.normalizePerformanceStats(raw.overallStats),
      homePerformance: this.normalizePerformanceStats(raw.homePerformance),
      awayPerformance: this.normalizePerformanceStats(raw.awayPerformance),
      scoringTrend,
    };
  }

  /** Normalize a TeamComparison object from the API */
  private normalizeComparison(raw: any): TeamComparison {
    if (!raw) return raw;
    const h2h = raw.headToHead || {};
    return {
      ...raw,
      homeTeam: this.normalizeTeamAnalytics(raw.homeTeam),
      awayTeam: this.normalizeTeamAnalytics(raw.awayTeam),
      headToHead: {
        ...h2h,
        homeWins: this.num(h2h.homeWins),
        draws: this.num(h2h.draws),
        awayWins: this.num(h2h.awayWins),
        totalMeetings: this.num(h2h.totalMeetings ?? (this.num(h2h.homeWins) + this.num(h2h.draws) + this.num(h2h.awayWins))),
        lastFiveMeetings: h2h.lastFiveMeetings ?? [],
      },
    };
  }
}
