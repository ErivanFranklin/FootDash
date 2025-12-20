import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Comment } from './entities/comment.entity';
import { Reaction } from './entities/reaction.entity';
import { Follow } from './entities/follow.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Report } from './entities/report.entity';

// Services
import { CommentsService } from './services/comments.service';
import { ReactionsService } from './services/reactions.service';
import { FollowService } from './services/follow.service';
import { FeedService } from './services/feed.service';
import { ReportsService } from './services/reports.service';

// Controllers
import { CommentsController } from './controllers/comments.controller';
import { ReactionsController } from './controllers/reactions.controller';
import { FollowController } from './controllers/follow.controller';
import { FeedController } from './controllers/feed.controller';
import { ReportsController } from './controllers/reports.controller';

// External dependencies
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Reaction, Follow, UserActivity, Report]),
    UsersModule,
    MatchesModule,
    WebsocketsModule,
  ],
  controllers: [
    CommentsController,
    ReactionsController,
    FollowController,
    FeedController,
    ReportsController,
  ],
  providers: [
    CommentsService,
    ReactionsService,
    FollowService,
    FeedService,
    ReportsService,
  ],
  exports: [
    CommentsService,
    ReactionsService,
    FollowService,
    FeedService,
    ReportsService,
  ],
})
export class SocialModule {}
