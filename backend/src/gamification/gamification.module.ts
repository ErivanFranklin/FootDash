import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { GamificationScheduler } from './gamification.scheduler';
import { BadgeService } from './badge.service';
import { UserPrediction } from './entities/user-prediction.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Leaderboard } from './entities/leaderboard.entity';
import { Match } from '../matches/entities/match.entity';
import { Comment } from '../social/entities/comment.entity';
import { Follow } from '../social/entities/follow.entity';
import { User } from '../users/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPrediction,
      Badge,
      UserBadge,
      Leaderboard,
      Match,
      Comment,
      Follow,
      User,
      UserProfile,
    ]),
    SocialModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationScheduler, BadgeService],
  exports: [GamificationService, BadgeService],
})
export class GamificationModule {}
