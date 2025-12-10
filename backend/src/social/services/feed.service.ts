import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserActivity, ActivityType, ActivityTargetType } from '../entities/user-activity.entity';
import { ActivityResponseDto } from '../dto/activity.dto';
import { FollowService } from './follow.service';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    private readonly followService: FollowService,
  ) {}

  async addActivity(
    userId: number,
    activityType: ActivityType,
    targetType: ActivityTargetType,
    targetId: number,
    metadata?: Record<string, any>,
  ): Promise<UserActivity> {
    const activity = this.activityRepository.create({
      userId,
      activityType,
      targetType,
      targetId,
      metadata,
    });

    return this.activityRepository.save(activity);
  }

  async getUserFeed(userId: number, page: number = 1, limit: number = 20): Promise<ActivityResponseDto[]> {
    // Get user's own activities
    const activities = await this.activityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichActivities(activities);
  }

  async getFollowingFeed(userId: number, page: number = 1, limit: number = 20): Promise<ActivityResponseDto[]> {
    // Get IDs of users that the current user follows
    const followingIds = await this.followService.getFollowingIds(userId);
    
    if (followingIds.length === 0) {
      return [];
    }

    // Get activities from followed users
    const activities = await this.activityRepository.find({
      where: { userId: In(followingIds) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichActivities(activities);
  }

  async getGlobalFeed(page: number = 1, limit: number = 20): Promise<ActivityResponseDto[]> {
    const activities = await this.activityRepository.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichActivities(activities);
  }

  async getMatchFeed(matchId: number, page: number = 1, limit: number = 20): Promise<ActivityResponseDto[]> {
    const activities = await this.activityRepository.find({
      where: { targetType: ActivityTargetType.MATCH, targetId: matchId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichActivities(activities);
  }

  async getUserActivityFeed(targetUserId: number, page: number = 1, limit: number = 20): Promise<ActivityResponseDto[]> {
    const activities = await this.activityRepository.find({
      where: { userId: targetUserId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichActivities(activities);
  }

  private enrichActivities(activities: UserActivity[]): ActivityResponseDto[] {
    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.user?.email || 'Unknown User',
      userAvatar: activity.user?.profilePhoto || undefined,
      activityType: activity.activityType,
      targetType: activity.targetType,
      targetId: activity.targetId,
      targetName: activity.metadata?.targetName,
      content: activity.metadata?.content,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    }));
  }
}
