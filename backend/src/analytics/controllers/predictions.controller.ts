import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MatchPredictionService } from '../services/match-prediction.service';
import { PredictionStrategyService } from '../services/prediction-strategy.service';
import { MLPredictionService } from '../services/ml-prediction.service';
import { PredictionResultDto } from '../dto/prediction-result.dto';

@ApiTags('Analytics - Predictions')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { ttl: 60_000, limit: 30 } })
export class PredictionsController {
  constructor(
    private readonly predictionService: MatchPredictionService,
    private readonly strategyService: PredictionStrategyService,
    private readonly mlPredictionService: MLPredictionService,
  ) {}

  @Get('match/:matchId/prediction')
  @ApiOperation({ summary: 'Get prediction for a specific match' })
  @ApiResponse({
    status: 200,
    description: 'Prediction retrieved successfully',
    type: PredictionResultDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getMatchPrediction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('force') forceRecalculate?: boolean,
  ) {
    return await this.strategyService.getPrediction(
      matchId,
      forceRecalculate === true,
    );
  }

  @Post('match/:matchId/predict')
  @ApiOperation({ summary: 'Generate new prediction for a match' })
  @ApiResponse({
    status: 201,
    description: 'Prediction generated successfully',
    type: PredictionResultDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async generatePrediction(@Param('matchId', ParseIntPipe) matchId: number) {
    return await this.strategyService.getPrediction(matchId, true);
  }

  @Get('upcoming-predictions')
  @ApiOperation({ summary: 'Get predictions for upcoming matches' })
  @ApiResponse({
    status: 200,
    description: 'Predictions retrieved successfully',
    type: [PredictionResultDto],
  })
  async getUpcomingPredictions(@Query('limit', ParseIntPipe) limit = 10) {
    return await this.predictionService.getUpcomingPredictions(limit);
  }

  @Get('predictions/stats')
  @ApiOperation({ summary: 'Get prediction performance statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getPredictionStats(
    @Query('strategy') strategy?: string,
    @Query('limit', ParseIntPipe) limit = 100,
  ) {
    return await this.strategyService.getPredictionStats(
      strategy as any,
      limit,
    );
  }

  @Get('ml/health')
  @ApiOperation({ summary: 'Check ML prediction service health' })
  @ApiResponse({ status: 200, description: 'ML service health status' })
  async getMLHealth() {
    const isHealthy = await this.mlPredictionService.checkMLServiceHealth();
    const info = isHealthy
      ? await this.mlPredictionService.getMLServiceInfo()
      : null;
    return { status: isHealthy ? 'healthy' : 'unavailable', info };
  }

  @Get('ml/metrics')
  @ApiOperation({ summary: 'Get ML model performance metrics' })
  @ApiResponse({ status: 200, description: 'Model metrics retrieved' })
  async getMLMetrics() {
    return await this.mlPredictionService.getModelMetrics();
  }

  @Get('match/:matchId/prediction/btts')
  @ApiOperation({ summary: 'Get BTTS prediction for a match' })
  @ApiResponse({ status: 200, description: 'BTTS prediction retrieved' })
  async getBttsPrediction(@Param('matchId', ParseIntPipe) matchId: number) {
    // Fetch match stats through the prediction service, then call ML
    const matchPrediction = await this.strategyService.getPrediction(matchId);
    const stats = (matchPrediction as any).stats || {};

    return await this.mlPredictionService.predictBtts({
      home_goals_avg: stats.homeGoalsAvg ?? 1.2,
      away_goals_avg: stats.awayGoalsAvg ?? 1.0,
      home_goals_conceded_avg: stats.homeGoalsConcededAvg ?? 1.1,
      away_goals_conceded_avg: stats.awayGoalsConcededAvg ?? 1.3,
      home_form_rating: stats.homeFormRating ?? 50,
      away_form_rating: stats.awayFormRating ?? 50,
      league_id: stats.leagueId ?? 39,
      season: stats.season ?? new Date().getFullYear().toString(),
    });
  }

  @Get('match/:matchId/prediction/over-under')
  @ApiOperation({ summary: 'Get Over/Under prediction for a match' })
  @ApiResponse({ status: 200, description: 'Over/Under prediction retrieved' })
  async getOverUnderPrediction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('line') line?: number,
  ) {
    const matchPrediction = await this.strategyService.getPrediction(matchId);
    const stats = (matchPrediction as any).stats || {};

    return await this.mlPredictionService.predictOverUnder({
      home_goals_avg: stats.homeGoalsAvg ?? 1.2,
      away_goals_avg: stats.awayGoalsAvg ?? 1.0,
      home_goals_conceded_avg: stats.homeGoalsConcededAvg ?? 1.1,
      away_goals_conceded_avg: stats.awayGoalsConcededAvg ?? 1.3,
      home_form_rating: stats.homeFormRating ?? 50,
      away_form_rating: stats.awayFormRating ?? 50,
      league_id: stats.leagueId ?? 39,
      season: stats.season ?? new Date().getFullYear().toString(),
      line: line ?? 2.5,
    });
  }
}
