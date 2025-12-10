import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFollowDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  followingId: number;
}

export class FollowResponseDto {
  id: number;
  followerId: number;
  followingId: number;
  followerName?: string;
  followingName?: string;
  createdAt: string;
}

export class FollowStatsDto {
  userId: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export class UserListItemDto {
  id: number;
  email: string;
  createdAt: string;
  isFollowing?: boolean;
}

export class PaginatedUsersDto {
  users: UserListItemDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
