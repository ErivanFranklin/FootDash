import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { UserPrediction } from './entities/user-prediction.entity';
import { Badge } from './entities/badge.entity';
import { Leaderboard } from './entities/leaderboard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPrediction, Badge, Leaderboard])],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
