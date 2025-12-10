import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReactionsService } from '../services/reactions.service';
import { FeedService } from '../services/feed.service';
import { CreateReactionDto } from '../dto/reaction.dto';
import { ReactionTargetType } from '../entities/reaction.entity';
import { ActivityType, ActivityTargetType } from '../entities/user-activity.entity';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(
    private readonly reactionsService: ReactionsService,
    private readonly feedService: FeedService,
  ) {}

  @Post()
  async addReaction(@Request() req, @Body() dto: CreateReactionDto) {
    const reaction = await this.reactionsService.addReaction(req.user.sub, dto);
    
    // Add to activity feed
    const activityTargetType = dto.targetType === 'match' 
      ? ActivityTargetType.MATCH 
      : dto.targetType === 'prediction'
        ? ActivityTargetType.PREDICTION
        : ActivityTargetType.COMMENT;

    await this.feedService.addActivity(
      req.user.sub,
      ActivityType.REACTION,
      activityTargetType,
      dto.targetId,
      { reactionType: dto.reactionType },
    );

    return reaction;
  }

  @Delete(':targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('targetType') targetType: ReactionTargetType,
    @Param('targetId') targetId: number,
    @Request() req,
  ) {
    await this.reactionsService.removeReaction(req.user.sub, targetType, targetId);
  }

  @Get(':targetType/:targetId')
  async getReactions(
    @Param('targetType') targetType: ReactionTargetType,
    @Param('targetId') targetId: number,
  ) {
    return this.reactionsService.getReactionsByTarget(targetType, targetId);
  }

  @Get(':targetType/:targetId/summary')
  async getReactionSummary(
    @Param('targetType') targetType: ReactionTargetType,
    @Param('targetId') targetId: number,
    @Request() req,
  ) {
    return this.reactionsService.getReactionSummary(targetType, targetId, req.user?.sub);
  }

  @Get('user/:targetType/:targetId')
  async getUserReaction(
    @Param('targetType') targetType: ReactionTargetType,
    @Param('targetId') targetId: number,
    @Request() req,
  ) {
    const reaction = await this.reactionsService.getUserReaction(req.user.sub, targetType, targetId);
    return reaction || { hasReaction: false };
  }
}
