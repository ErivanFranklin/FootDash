import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { GamificationScheduler } from './gamification.scheduler';
import { UserPrediction } from './entities/user-prediction.entity';
import { Badge } from './entities/badge.entity';
import { Leaderboard } from './entities/leaderboard.entity';
import { Match } from '../matches/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPrediction, Badge, Leaderboard, Match])],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationScheduler],
  exports: [GamificationService],
})
export class GamificationModule {}
