import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchPrediction } from './entities/match-prediction.entity';
import { TeamAnalytics } from './entities/team-analytics.entity';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { FormCalculatorService } from './services/form-calculator.service';
import { StatisticalAnalysisService } from './services/statistical-analysis.service';
import { InsightsGeneratorService } from './services/insights-generator.service';
import { MatchPredictionService } from './services/match-prediction.service';
import { TeamAnalyticsService } from './services/team-analytics.service';
import { PredictionsController } from './controllers/predictions.controller';
import { TeamAnalyticsController } from './controllers/team-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchPrediction, TeamAnalytics, Match, Team]),
  ],
  controllers: [PredictionsController, TeamAnalyticsController],
  providers: [
    FormCalculatorService,
    StatisticalAnalysisService,
    InsightsGeneratorService,
    MatchPredictionService,
    TeamAnalyticsService,
  ],
  exports: [MatchPredictionService, TeamAnalyticsService],
})
export class AnalyticsModule {}
