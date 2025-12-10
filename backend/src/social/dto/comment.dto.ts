import { IsString, IsInt, IsOptional, MaxLength, MinLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  matchId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  predictionId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentCommentId?: number;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;
}

export class CommentResponseDto {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  matchId?: number;
  predictionId?: number;
  parentCommentId?: number;
  content: string;
  replyCount: number;
  reactionCount: number;
  userReaction?: string;
  createdAt: Date;
  updatedAt: Date;
}
