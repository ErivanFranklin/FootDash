import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PredictionResult } from '../interfaces/analytics.interface';

export interface MLPredictionRequest {
  home_form_rating: number;
  away_form_rating: number;
  home_win_rate: number;
  away_win_rate: number;
  home_goals_avg: number;
  away_goals_avg: number;
  home_goals_conceded_avg: number;
  away_goals_conceded_avg: number;
  h2h_home_wins: number;
  h2h_away_wins: number;
  h2h_draws: number;
  is_home: boolean;
  league_id: number;
  season: string;
  days_since_last_match?: number;
  home_recent_form?: string[];
  away_recent_form?: string[];
}

export interface MLPredictionResponse {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  confidence: string;
  model_version: string;
  features_used: string[];
  feature_importance?: Record<string, number>;
}

@Injectable()
export class MLPredictionService {
  private readonly logger = new Logger(MLPredictionService.name);
  private readonly mlApiUrl: string;
  private readonly timeout: number = 5000; // 5 second timeout
  private healthCheckCache: { isHealthy: boolean; lastCheck: number } = {
    isHealthy: false,
    lastCheck: 0,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mlApiUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:8000');
    this.logger.log(`ML Service URL configured: ${this.mlApiUrl}`);
  }

  /**
   * Generate ML-based prediction for a match
   */
  async generateMLPrediction(request: MLPredictionRequest): Promise<PredictionResult> {
    try {
      // Check if ML service is healthy
      const isHealthy = await this.checkMLServiceHealth();
      if (!isHealthy) {
        throw new HttpException(
          'ML prediction service is unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Make prediction request
      const response = await firstValueFrom(
        this.httpService.post<MLPredictionResponse>(
          `${this.mlApiUrl}/predict`,
          request,
          { timeout: this.timeout },
        ),
      );

      // Transform ML response to FootDash format
      return this.transformMLResponse(response.data, request);
    } catch (error) {
      this.logger.error(`ML prediction failed: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'ML prediction service error',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if ML service is healthy
   */
  async checkMLServiceHealth(): Promise<boolean> {
    const now = Date.now();
    const cacheValid = now - this.healthCheckCache.lastCheck < 30000; // 30 second cache

    if (cacheValid) {
      return this.healthCheckCache.isHealthy;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlApiUrl}/health`, {
          timeout: 3000, // Shorter timeout for health check
        }),
      );

      const isHealthy = response.data.status === 'healthy' && response.data.model_loaded;
      
      this.healthCheckCache = {
        isHealthy,
        lastCheck: now,
      };

      this.logger.debug(`ML service health check: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      return isHealthy;
    } catch (error) {
      this.logger.warn(`ML service health check failed: ${error.message}`);
      
      this.healthCheckCache = {
        isHealthy: false,
        lastCheck: now,
      };

      return false;
    }
  }

  /**
   * Get ML service information
   */
  async getMLServiceInfo(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlApiUrl}/model/info`, {
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get ML service info: ${error.message}`);
      throw new HttpException(
        'ML service info unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Transform ML service response to FootDash PredictionResult format
   */
  private transformMLResponse(
    mlResponse: MLPredictionResponse,
    originalRequest: MLPredictionRequest,
  ): PredictionResult {
    return {
      homeWinProbability: mlResponse.home_win_probability,
      drawProbability: mlResponse.draw_probability,
      awayWinProbability: mlResponse.away_win_probability,
      confidence: mlResponse.confidence,
      insights: this.generateMLInsights(mlResponse, originalRequest),
      metadata: {
        model_type: 'ml',
        model_version: mlResponse.model_version,
        features_used: mlResponse.features_used,
        feature_importance: mlResponse.feature_importance,
        confidence_score: Math.max(
          mlResponse.home_win_probability,
          mlResponse.draw_probability,
          mlResponse.away_win_probability,
        ),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate insights based on ML prediction
   */
  private generateMLInsights(
    mlResponse: MLPredictionResponse,
    request: MLPredictionRequest,
  ): string[] {
    const insights: string[] = [];

    // Determine most likely outcome
    const maxProb = Math.max(
      mlResponse.home_win_probability,
      mlResponse.draw_probability,
      mlResponse.away_win_probability,
    );

    let prediction: string;
    if (maxProb === mlResponse.home_win_probability) {
      prediction = 'home win';
    } else if (maxProb === mlResponse.draw_probability) {
      prediction = 'draw';
    } else {
      prediction = 'away win';
    }

    insights.push(`ML model predicts ${prediction} with ${maxProb.toFixed(1)}% probability`);

    // Add confidence insight
    insights.push(`Prediction confidence: ${mlResponse.confidence.toUpperCase()}`);

    // Form comparison
    const formDiff = request.home_form_rating - request.away_form_rating;
    if (Math.abs(formDiff) > 10) {
      const betterTeam = formDiff > 0 ? 'Home team' : 'Away team';
      insights.push(`${betterTeam} has significantly better recent form (${Math.abs(formDiff).toFixed(1)} points difference)`);
    }

    // Goals comparison
    const goalsDiff = request.home_goals_avg - request.away_goals_avg;
    if (Math.abs(goalsDiff) > 0.5) {
      const betterAttack = goalsDiff > 0 ? 'Home team' : 'Away team';
      insights.push(`${betterAttack} averages ${Math.abs(goalsDiff).toFixed(1)} more goals per game`);
    }

    // Feature importance insights (if available)
    if (mlResponse.feature_importance) {
      const topFeature = Object.entries(mlResponse.feature_importance)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (topFeature) {
        insights.push(`Key factor: ${topFeature[0].replace(/_/g, ' ')} (${(topFeature[1] * 100).toFixed(1)}% importance)`);
      }
    }

    // Model version info
    insights.push(`Prediction generated using ${mlResponse.model_version} ML model`);

    return insights;
  }

  /**
   * Prepare data for ML request from match details
   */
  prepareMLRequest(matchData: {
    homeForm: any;
    awayForm: any;
    homeStats: any;
    awayStats: any;
    h2h: any;
    matchDetails: any;
  }): MLPredictionRequest {
    const { homeForm, awayForm, homeStats, awayStats, h2h, matchDetails } = matchData;

    return {
      home_form_rating: homeForm.formRating || 50,
      away_form_rating: awayForm.formRating || 50,
      home_win_rate: homeStats.winPercentage || 50,
      away_win_rate: awayStats.winPercentage || 50,
      home_goals_avg: homeStats.goalsPerGame || 1.0,
      away_goals_avg: awayStats.goalsPerGame || 1.0,
      home_goals_conceded_avg: homeStats.goalsConcededPerGame || 1.0,
      away_goals_conceded_avg: awayStats.goalsConcededPerGame || 1.0,
      h2h_home_wins: h2h.homeWins || 0,
      h2h_away_wins: h2h.awayWins || 0,
      h2h_draws: h2h.draws || 0,
      is_home: true,
      league_id: matchDetails.league?.id || 1,
      season: matchDetails.season || new Date().getFullYear().toString(),
      days_since_last_match: this.calculateDaysSinceLastMatch(),
      home_recent_form: homeForm.recentResults || [],
      away_recent_form: awayForm.recentResults || [],
    };
  }

  /**
   * Calculate days since last match (simplified)
   */
  private calculateDaysSinceLastMatch(): number {
    // This would normally calculate based on actual last match dates
    // For now, return a reasonable default
    return 7;
  }
}