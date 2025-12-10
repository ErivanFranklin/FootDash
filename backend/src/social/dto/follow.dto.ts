import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFollowDto {
  @IsInt()
  @Type(() => Number)
  followingId: number;
}

export class FollowResponseDto {
  id: number;
  followerId: number;
  followingId: number;
  followerName?: string;
  followingName?: string;
  createdAt: Date;
}

export class FollowStatsDto {
  followers: number;
  following: number;
}
