import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Comment } from './entities/comment.entity';
import { Reaction } from './entities/reaction.entity';
import { Follow } from './entities/follow.entity';
import { UserActivity } from './entities/user-activity.entity';
import { User } from '../users/user.entity';

// Services
import { CommentsService } from './services/comments.service';
import { ReactionsService } from './services/reactions.service';
import { FollowService } from './services/follow.service';
import { FeedService } from './services/feed.service';

// Controllers
import { CommentsController } from './controllers/comments.controller';
import { ReactionsController } from './controllers/reactions.controller';
import { FollowController } from './controllers/follow.controller';
import { FeedController } from './controllers/feed.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Reaction,
      Follow,
      UserActivity,
      User,
    ]),
  ],
  controllers: [
    CommentsController,
    ReactionsController,
    FollowController,
    FeedController,
  ],
  providers: [
    CommentsService,
    ReactionsService,
    FollowService,
    FeedService,
  ],
  exports: [
    CommentsService,
    ReactionsService,
    FollowService,
    FeedService,
  ],
})
export class SocialModule {}
