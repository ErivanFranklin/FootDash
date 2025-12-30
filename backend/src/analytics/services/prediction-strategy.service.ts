import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchPredictionService } from './match-prediction.service';
import { MLPredictionService } from './ml-prediction.service';
import { PredictionResult } from '../interfaces/analytics.interface';
import { PredictionPerformance } from '../entities/prediction-performance.entity';

export enum PredictionStrategy {
  STATISTICAL = 'statistical',
  ML = 'ml',
  HYBRID = 'hybrid',
}

@Injectable()
export class PredictionStrategyService {
  private readonly logger = new Logger(PredictionStrategyService.name);

  constructor(
    private readonly statisticalService: MatchPredictionService,
    private readonly mlService: MLPredictionService,
    private readonly configService: ConfigService,
    @InjectRepository(PredictionPerformance)
    private readonly performanceRepository: Repository<PredictionPerformance>,
  ) {}

  /**
   * Get prediction using the configured strategy (A/B testing)
   */
  async getPrediction(
    matchId: number,
    forceRecalculate = false,
  ): Promise<PredictionResult> {
    const strategy = this.determineStrategy(matchId);
    
    this.logger.debug(`Using ${strategy} strategy for match ${matchId}`);

    try {
      let prediction: PredictionResult;

      switch (strategy) {
        case PredictionStrategy.ML:
          prediction = await this.getMLPrediction(matchId);
          break;
        case PredictionStrategy.HYBRID:
          prediction = await this.getHybridPrediction(matchId);
          break;
        case PredictionStrategy.STATISTICAL:
        default:
          prediction = await this.getStatisticalPrediction(matchId, forceRecalculate);
          break;
      }

      // Track prediction for performance monitoring
      await this.trackPrediction(matchId, strategy, prediction);

      return prediction;
    } catch (error) {
      this.logger.error(`${strategy} prediction failed for match ${matchId}: ${error.message}`);
      
      // Fallback to statistical prediction
      if (strategy !== PredictionStrategy.STATISTICAL) {
        this.logger.log(`Falling back to statistical prediction for match ${matchId}`);
        const fallbackPrediction = await this.getStatisticalPrediction(matchId, forceRecalculate);
        await this.trackPrediction(matchId, PredictionStrategy.STATISTICAL, fallbackPrediction);
        return fallbackPrediction;
      }

      throw error;
    }
  }

  /**
   * Get statistical prediction (existing service)
   */
  private async getStatisticalPrediction(
    matchId: number,
    forceRecalculate: boolean,
  ): Promise<PredictionResult> {
    const prediction = await this.statisticalService.getPrediction(matchId, forceRecalculate);
    prediction.metadata = {
      ...prediction.metadata,
      model_type: 'statistical',
      strategy: PredictionStrategy.STATISTICAL,
    };
    return prediction;
  }

  /**
   * Get ML prediction
   */
  private async getMLPrediction(
    matchId: number,
  ): Promise<PredictionResult> {
    // Check if ML service is available
    const isMLHealthy = await this.mlService.checkMLServiceHealth();
    if (!isMLHealthy) {
      throw new Error('ML service is unavailable');
    }

    // Get match data (similar to statistical service)
    const matchData = await this.statisticalService.getMatchDataForPrediction(matchId);
    const mlRequest = this.mlService.prepareMLRequest(matchData);
    
    const predictionResult = await this.mlService.generateMLPrediction(mlRequest);

    const match = matchData.match;

    const mostLikely = (Object.keys(predictionResult) as (keyof typeof predictionResult)[]).reduce((a, b) => predictionResult[a] > predictionResult[b] ? a : b);

    const finalPrediction: PredictionResult = {
      ...predictionResult,
      matchId: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      mostLikely: mostLikely.replace('Probability', '').replace('Win', '').toLowerCase() as 'home' | 'draw' | 'away',
      createdAt: new Date(),
      metadata: {
        ...predictionResult.metadata,
        strategy: PredictionStrategy.ML,
      },
    };
    
    return finalPrediction;
  }

  /**
   * Get hybrid prediction (combination of statistical and ML)
   */
  private async getHybridPrediction(
    matchId: number,
  ): Promise<PredictionResult> {
    try {
      // Get both predictions
      const [statisticalPred, mlPred] = await Promise.allSettled([
        this.getStatisticalPrediction(matchId, forceRecalculate),
        this.getMLPrediction(matchId),
      ]);

      // If both succeed, blend the results
      if (statisticalPred.status === 'fulfilled' && mlPred.status === 'fulfilled') {
        return this.blendPredictions(statisticalPred.value, mlPred.value);
      }

      // If only one succeeds, use that one
      if (statisticalPred.status === 'fulfilled') {
        return statisticalPred.value;
      }
      if (mlPred.status === 'fulfilled') {
        return mlPred.value;
      }

      // If both fail, throw error
      throw new Error('Both statistical and ML predictions failed');
    } catch (error) {
      this.logger.error(`Hybrid prediction failed for match ${matchId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Blend statistical and ML predictions
   */
  private blendPredictions(
    statistical: PredictionResult,
    ml: PredictionResult,
  ): PredictionResult {
    // Weight: 60% ML, 40% statistical (can be configurable)
    const mlWeight = this.configService.get<number>('ML_WEIGHT', 0.6);
    const statWeight = 1 - mlWeight;

    return {
      homeWinProbability: 
        ml.homeWinProbability * mlWeight + statistical.homeWinProbability * statWeight,
      drawProbability: 
        ml.drawProbability * mlWeight + statistical.drawProbability * statWeight,
      awayWinProbability: 
        ml.awayWinProbability * mlWeight + statistical.awayWinProbability * statWeight,
      confidence: this.blendConfidence(ml.confidence, statistical.confidence),
      insights: [...ml.insights.slice(0, 3), ...statistical.insights.slice(0, 2)],
      metadata: {
        model_type: 'hybrid',
        strategy: PredictionStrategy.HYBRID,
        ml_weight: mlWeight,
        statistical_weight: statWeight,
        ml_model_version: ml.metadata?.model_version,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Determine which strategy to use for a given match
   */
  private determineStrategy(matchId: number): PredictionStrategy {
    const abTestEnabled = this.configService.get<boolean>('ML_AB_TEST_ENABLED', false);
    if (!abTestEnabled) {
      return PredictionStrategy.STATISTICAL;
    }

    const strategy = this.configService.get<string>('DEFAULT_PREDICTION_STRATEGY', 'statistical');
    
    // A/B testing logic
    if (strategy === 'ab_test') {
      const mlPercentage = this.configService.get<number>('ML_PERCENTAGE', 50);
      const useML = (matchId % 100) < mlPercentage;
      return useML ? PredictionStrategy.ML : PredictionStrategy.STATISTICAL;
    }

    // Specific strategy configuration
    switch (strategy) {
      case 'ml':
        return PredictionStrategy.ML;
      case 'hybrid':
        return PredictionStrategy.HYBRID;
      case 'statistical':
      default:
        return PredictionStrategy.STATISTICAL;
    }
  }

  /**
   * Track prediction for performance monitoring
   */
  private async trackPrediction(
    matchId: number,
    strategy: PredictionStrategy,
    prediction: PredictionResult,
  ): Promise<void> {
    try {
      const performance = this.performanceRepository.create({
        matchId,
        modelType: strategy,
        prediction: {
          homeWin: prediction.homeWinProbability,
          draw: prediction.drawProbability,
          awayWin: prediction.awayWinProbability,
        },
        confidenceScore: Math.max(
          prediction.homeWinProbability,
          prediction.drawProbability,
          prediction.awayWinProbability,
        ),
        metadata: prediction.metadata,
      });

      await this.performanceRepository.save(performance);
    } catch (error) {
      this.logger.error(`Failed to track prediction performance: ${error.message}`);
      // Don't throw error, as this shouldn't fail the prediction
    }
  }

  /**
   * Blend confidence levels
   */
  private blendConfidence(mlConfidence: string, statConfidence: string): string {
    const confidenceMap = { low: 1, medium: 2, high: 3 };
    const reverseMap = { 1: 'low', 2: 'medium', 3: 'high' };
    
    const mlScore = confidenceMap[mlConfidence] || 2;
    const statScore = confidenceMap[statConfidence] || 2;
    
    const blended = Math.round((mlScore + statScore) / 2);
    return reverseMap[blended] || 'medium';
  }

  /**
   * Get prediction performance statistics
   */
  async getPredictionStats(
    strategy?: PredictionStrategy,
    limit = 100,
  ): Promise<any> {
    const query = this.performanceRepository
      .createQueryBuilder('performance')
      .select([
        'COUNT(*) as total_predictions',
        'COUNT(CASE WHEN was_correct = true THEN 1 END) as correct_predictions',
        'AVG(confidence_score) as avg_confidence',
        'model_type',
      ])
      .where('evaluated_at IS NOT NULL')
      .groupBy('model_type')
      .limit(limit);

    if (strategy) {
      query.andWhere('model_type = :strategy', { strategy });
    }

    const results = await query.getRawMany();
    
    return results.map(result => ({
      model_type: result.model_type,
      total_predictions: parseInt(result.total_predictions),
      correct_predictions: parseInt(result.correct_predictions || 0),
      accuracy: result.total_predictions > 0 
        ? (parseInt(result.correct_predictions || 0) / parseInt(result.total_predictions)) * 100 
        : 0,
      avg_confidence: parseFloat(result.avg_confidence || 0),
    }));
  }
}