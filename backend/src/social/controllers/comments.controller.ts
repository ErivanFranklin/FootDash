import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommentsService } from '../services/comments.service';
import { FeedService } from '../services/feed.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { ActivityType, ActivityTargetType } from '../entities/user-activity.entity';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly feedService: FeedService,
  ) {}

  @Post()
  async createComment(@Request() req, @Body() dto: CreateCommentDto) {
    const comment = await this.commentsService.createComment(req.user.sub, dto);
    
    // Add to activity feed
    const targetType = dto.matchId 
      ? ActivityTargetType.MATCH 
      : dto.predictionId 
        ? ActivityTargetType.PREDICTION 
        : ActivityTargetType.COMMENT;
    
    const targetId = dto.matchId || dto.predictionId || dto.parentCommentId;
    
    await this.feedService.addActivity(
      req.user.sub,
      ActivityType.COMMENT,
      targetType,
      targetId,
      { content: dto.content.substring(0, 100) },
    );

    return comment;
  }

  @Get('match/:matchId')
  async getMatchComments(
    @Param('matchId') matchId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req,
  ) {
    return this.commentsService.getCommentsByMatch(matchId, page, limit, req.user?.sub);
  }

  @Get('prediction/:predictionId')
  async getPredictionComments(
    @Param('predictionId') predictionId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req,
  ) {
    return this.commentsService.getCommentsByPrediction(predictionId, page, limit, req.user?.sub);
  }

  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.commentsService.getReplies(commentId, page, limit, req.user?.sub);
  }

  @Put(':commentId')
  async updateComment(
    @Param('commentId') commentId: number,
    @Body() dto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.updateComment(commentId, req.user.sub, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('commentId') commentId: number, @Request() req) {
    await this.commentsService.deleteComment(commentId, req.user.sub);
  }

  @Get('count/:targetType/:targetId')
  async getCommentCount(
    @Param('targetType') targetType: 'match' | 'prediction',
    @Param('targetId') targetId: number,
  ) {
    const count = await this.commentsService.getCommentCount(targetType, targetId);
    return { count };
  }
}
