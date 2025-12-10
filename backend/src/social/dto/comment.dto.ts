import { IsString, IsInt, IsOptional, MaxLength, MinLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
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
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
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
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export class PaginatedCommentsDto {
  comments: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
