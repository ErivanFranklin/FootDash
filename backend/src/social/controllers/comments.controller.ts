import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async createComment(
    @Request() req: { user: { sub: number } },
    @Body() dto: CreateCommentDto,
  ) {
    const userId = req.user.sub;
    const comment = await this.commentsService.createComment(userId, dto);
    return { success: true, comment };
  }

  @Get('match/:matchId')
  async getMatchComments(
    @Param('matchId') matchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.commentsService.getCommentsByMatch(
      parseInt(matchId),
      query,
    );
    return { success: true, ...result };
  }

  @Get('prediction/:predictionId')
  async getPredictionComments(
    @Param('predictionId') predictionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.commentsService.getCommentsByPrediction(
      parseInt(predictionId),
      query,
    );
    return { success: true, ...result };
  }

  @Get(':commentId/replies')
  async getCommentReplies(
    @Param('commentId') commentId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.commentsService.getReplies(
      parseInt(commentId),
      query,
    );
    return { success: true, ...result };
  }

  @Put(':commentId')
  async updateComment(
    @Request() req: { user: { sub: number } },
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const userId = req.user.sub;
    const comment = await this.commentsService.updateComment(
      parseInt(commentId),
      userId,
      dto,
    );
    return { success: true, comment };
  }

  @Delete(':commentId')
  async deleteComment(
    @Request() req: { user: { sub: number } },
    @Param('commentId') commentId: string,
  ) {
    const userId = req.user.sub;
    await this.commentsService.deleteComment(parseInt(commentId), userId);
    return { success: true, message: 'Comment deleted successfully' };
  }

  @Get('count/match/:matchId')
  async getMatchCommentCount(@Param('matchId') matchId: string) {
    const count = await this.commentsService.getCommentCount(
      'match',
      parseInt(matchId),
    );
    return { success: true, count };
  }

  @Get('count/prediction/:predictionId')
  async getPredictionCommentCount(@Param('predictionId') predictionId: string) {
    const count = await this.commentsService.getCommentCount(
      'prediction',
      parseInt(predictionId),
    );
    return { success: true, count };
  }
}
