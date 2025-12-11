import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ReactionType, ReactionTargetType } from '../entities/reaction.entity';

export class CreateReactionDto {
  @IsEnum(ReactionTargetType)
  @IsNotEmpty()
  targetType: ReactionTargetType;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  targetId: number;

  @IsEnum(ReactionType)
  @IsNotEmpty()
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
  createdAt: string;
}
