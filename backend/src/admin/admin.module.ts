import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { User } from '../users/user.entity';
import { UserActivity } from '../social/entities/user-activity.entity';
import { PredictionPerformance } from '../analytics/entities/prediction-performance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity, PredictionPerformance]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAnalyticsService],
})
export class AdminModule {}
