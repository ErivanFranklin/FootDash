import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ActivityType,
  ActivityTargetType,
} from '../entities/user-activity.entity';

export enum FeedType {
  FOLLOWING = 'following',
  GLOBAL = 'global',
}

export class ActivityResponseDto {
  id: number;
  userId: number;
  userName: string;
  activityType: ActivityType;
  targetType: ActivityTargetType;
  targetId: number;
  targetName?: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export class PaginatedActivityDto {
  activities: ActivityResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class FeedQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @IsOptional()
  @IsEnum(FeedType)
  feedType?: FeedType = FeedType.FOLLOWING;
}

export class CreateActivityDto {
  userId: number;
  activityType: ActivityType;
  targetType: ActivityTargetType;
  targetId: number;
  metadata?: Record<string, any>;
}
