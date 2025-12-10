import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserActivity, ActivityType, ActivityTargetType } from '../entities/user-activity.entity';
import { Follow } from '../entities/follow.entity';
import { ActivityResponseDto, PaginatedActivityDto, FeedQueryDto, CreateActivityDto } from '../dto/activity.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async getUserFeed(userId: number, query: FeedQueryDto): Promise<PaginatedActivityDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Get list of users that this user follows
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    const followingIds = follows.map(f => f.followingId);
    
    // Include user's own activities
    followingIds.push(userId);

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.userId IN (:...userIds)', { userIds: followingIds })
      .orderBy('activity.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: query.activityType });
    }

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities: activities.map(a => this.toResponseDto(a)),
      total,
      page,
      limit,
      hasMore: skip + activities.length < total,
    };
  }

  async getGlobalFeed(query: FeedQueryDto): Promise<PaginatedActivityDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy('activity.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.activityType) {
      queryBuilder.where('activity.activityType = :activityType', { activityType: query.activityType });
    }

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities: activities.map(a => this.toResponseDto(a)),
      total,
      page,
      limit,
      hasMore: skip + activities.length < total,
    };
  }

  async getMatchFeed(matchId: number, query: FeedQueryDto): Promise<PaginatedActivityDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.targetType = :targetType', { targetType: ActivityTargetType.MATCH })
      .andWhere('activity.targetId = :matchId', { matchId })
      .orderBy('activity.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: query.activityType });
    }

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities: activities.map(a => this.toResponseDto(a)),
      total,
      page,
      limit,
      hasMore: skip + activities.length < total,
    };
  }

  async getUserActivity(targetUserId: number, query: FeedQueryDto): Promise<PaginatedActivityDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.userId = :userId', { userId: targetUserId })
      .orderBy('activity.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: query.activityType });
    }

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities: activities.map(a => this.toResponseDto(a)),
      total,
      page,
      limit,
      hasMore: skip + activities.length < total,
    };
  }

  async addActivity(dto: CreateActivityDto): Promise<UserActivity> {
    const activity = this.activityRepository.create({
      userId: dto.userId,
      activityType: dto.activityType,
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata,
    });

    return await this.activityRepository.save(activity);
  }

  async deleteActivitiesByTarget(targetType: ActivityTargetType, targetId: number): Promise<void> {
    await this.activityRepository.delete({ targetType, targetId });
  }

  toResponseDto(activity: UserActivity): ActivityResponseDto {
    return {
      id: activity.id,
      userId: activity.userId,
      userName: activity.user?.email || 'Unknown',
      userAvatar: activity.user?.avatar,
      activityType: activity.activityType,
      targetType: activity.targetType,
      targetId: activity.targetId,
      targetName: activity.metadata?.targetName,
      content: activity.metadata?.content,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
    };
  }
}
