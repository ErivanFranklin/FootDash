import { IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ReactionType, ReactionTargetType } from '../entities/reaction.entity';

export class CreateReactionDto {
  @IsEnum(ReactionTargetType)
  targetType: ReactionTargetType;

  @IsInt()
  @Type(() => Number)
  targetId: number;

  @IsEnum(ReactionType)
  reactionType: ReactionType;
}

export class ReactionSummaryDto {
  like: number;
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
  userReaction?: ReactionType;
}

export class ReactionResponseDto {
  id: number;
  userId: number;
  userName: string;
  targetType: ReactionTargetType;
  targetId: number;
  reactionType: ReactionType;
  createdAt: Date;
}
