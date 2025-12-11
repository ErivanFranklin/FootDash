import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { User } from '../../users/user.entity';
import { CreateFollowDto, FollowResponseDto, FollowStatsDto, UserListItemDto, PaginatedUsersDto } from '../dto/follow.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { SocialGateway } from '../../websockets/social.gateway';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly socialGateway: SocialGateway,
  ) {}

  async followUser(followerId: number, dto: CreateFollowDto): Promise<Follow> {
    const { followingId } = dto;

    // Can't follow yourself
    if (followerId === followingId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    const follow = this.followRepository.create({
      followerId,
      followingId,
    });

    const savedFollow = await this.followRepository.save(follow);

    // Broadcast real-time follow event (global event for feed updates)
    this.socialGateway.broadcastGlobalEvent({
      type: 'follow',
      targetType: 'match', // Not relevant for follow events
      targetId: followingId,
      userId: followerId,
      userName: '', // Will be populated by controller
      data: {
        follow: savedFollow,
        followerStats: await this.getFollowStats(followerId),
        followingStats: await this.getFollowStats(followingId),
      },
    });

    return savedFollow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(follow);
    return true;
  }

  async getFollowers(userId: number, query: PaginationQueryDto): Promise<PaginatedUsersDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const users = follows.map(f => this.toUserListItem(f.follower));

    return {
      users,
      total,
      page,
      limit,
      hasMore: skip + users.length < total,
    };
  }

  async getFollowing(userId: number, query: PaginationQueryDto): Promise<PaginatedUsersDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const users = follows.map(f => this.toUserListItem(f.following));

    return {
      users,
      total,
      page,
      limit,
      hasMore: skip + users.length < total,
    };
  }

  async getFollowerCount(userId: number): Promise<number> {
    return await this.followRepository.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: number): Promise<number> {
    return await this.followRepository.count({
      where: { followerId: userId },
    });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    return !!follow;
  }

  async getFollowStats(currentUserId: number | null, targetUserId: number): Promise<FollowStatsDto> {
    const followersCount = await this.getFollowerCount(targetUserId);
    const followingCount = await this.getFollowingCount(targetUserId);
    
    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
      isFollowing = await this.isFollowing(currentUserId, targetUserId);
    }

    return {
      userId: targetUserId,
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  toResponseDto(follow: Follow): FollowResponseDto {
    return {
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      followerName: follow.follower?.email,
      followingName: follow.following?.email,
      createdAt: follow.createdAt.toISOString(),
    };
  }

  private toUserListItem(user: User): UserListItemDto {
    return {
      id: Number(user.id),
      email: user.email,
      createdAt: user.created_at.toISOString(),
    };
  }
}
