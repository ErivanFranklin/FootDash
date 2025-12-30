import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MatchPrediction } from './entities/match-prediction.entity';
import { TeamAnalytics } from './entities/team-analytics.entity';
import { PredictionPerformance } from './entities/prediction-performance.entity';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { FormCalculatorService } from './services/form-calculator.service';
import { StatisticalAnalysisService } from './services/statistical-analysis.service';
import { InsightsGeneratorService } from './services/insights-generator.service';
import { MatchPredictionService } from './services/match-prediction.service';
import { TeamAnalyticsService } from './services/team-analytics.service';
import { MLPredictionService } from './services/ml-prediction.service';
import { PredictionStrategyService } from './services/prediction-strategy.service';
import { DataExportService } from './services/data-export.service';
import { PredictionsController } from './controllers/predictions.controller';
import { TeamAnalyticsController } from './controllers/team-analytics.controller';
import { DataExportController } from './controllers/data-export.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchPrediction,
      TeamAnalytics,
      PredictionPerformance,
      Match,
      Team,
    ]),
    HttpModule,
  ],
  controllers: [
    PredictionsController,
    TeamAnalyticsController,
    DataExportController,
  ],
  providers: [
    FormCalculatorService,
    StatisticalAnalysisService,
    InsightsGeneratorService,
    MatchPredictionService,
    TeamAnalyticsService,
    MLPredictionService,
    PredictionStrategyService,
    DataExportService,
  ],
  exports: [
    MatchPredictionService,
    TeamAnalyticsService,
    PredictionStrategyService,
    DataExportService,
  ],
})
export class AnalyticsModule {}
