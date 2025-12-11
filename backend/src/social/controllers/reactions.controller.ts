import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReactionsService } from '../services/reactions.service';
import { CreateReactionDto } from '../dto/reaction.dto';
import { ReactionTargetType } from '../entities/reaction.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  async addReaction(
    @Request() req: { user: { sub: number } },
    @Body() dto: CreateReactionDto,
  ) {
    const userId = req.user.sub;
    const reaction = await this.reactionsService.addReaction(userId, dto);
    return {
      success: true,
      reaction: this.reactionsService.toResponseDto(reaction),
    };
  }

  @Delete(':targetType/:targetId')
  async removeReaction(
    @Request() req: { user: { sub: number } },
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const userId = req.user.sub;
    await this.reactionsService.removeReaction(
      userId,
      targetType as ReactionTargetType,
      parseInt(targetId),
    );
    return { success: true, message: 'Reaction removed successfully' };
  }

  @Get(':targetType/:targetId')
  async getReactionSummary(
    @Request() req: { user?: { sub: number } },
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const userId = req.user?.sub || null;
    const summary = await this.reactionsService.getReactionSummary(
      userId,
      targetType as ReactionTargetType,
      parseInt(targetId),
    );
    return { success: true, summary };
  }

  @Get(':targetType/:targetId/list')
  async getReactionsList(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const reactions = await this.reactionsService.getReactionsByTarget(
      targetType as ReactionTargetType,
      parseInt(targetId),
    );
    return {
      success: true,
      reactions: reactions.map((r) => this.reactionsService.toResponseDto(r)),
    };
  }

  @Get('user/:targetType/:targetId')
  async getUserReaction(
    @Request() req: { user: { sub: number } },
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const userId = req.user.sub;
    const reaction = await this.reactionsService.getUserReaction(
      userId,
      targetType as ReactionTargetType,
      parseInt(targetId),
    );

    if (!reaction) {
      return { success: true, reaction: null };
    }

    return {
      success: true,
      reaction: this.reactionsService.toResponseDto(reaction),
    };
  }
}
