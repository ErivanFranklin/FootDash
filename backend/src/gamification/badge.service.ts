import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Badge, BadgeCriteriaType } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { UserPrediction } from './entities/user-prediction.entity';
import { Comment } from '../social/entities/comment.entity';
import { Follow } from '../social/entities/follow.entity';
import { User } from '../users/user.entity';
import {
  AlertsService,
  CreateAlertDto,
} from '../social/services/alerts.service';
import { AlertType } from '../social/entities/alert.entity';

export interface BadgeResponseDto {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  slug: string;
  tier: string;
  criteriaType: string;
  threshold: number;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(UserPrediction)
    private readonly predictionRepo: Repository<UserPrediction>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly alertsService: AlertsService,
  ) {}

  /** Get all badges with user unlock state */
  async getAllBadges(userId?: number): Promise<BadgeResponseDto[]> {
    const badges = await this.badgeRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    let unlockedMap = new Map<number, Date>();
    if (userId) {
      const unlocked = await this.userBadgeRepo.find({
        where: { userId },
        select: ['badgeId', 'unlockedAt'],
      });
      unlockedMap = new Map(unlocked.map((ub) => [ub.badgeId, ub.unlockedAt]));
    }

    const progressMap = userId
      ? await this.getProgressMap(userId, badges)
      : new Map<number, number>();

    return badges.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      slug: b.slug,
      tier: b.tier,
      criteriaType: b.criteriaType,
      threshold: b.threshold,
      sortOrder: b.sortOrder,
      unlocked: unlockedMap.has(b.id),
      unlockedAt: unlockedMap.get(b.id)?.toISOString(),
      progress: unlockedMap.has(b.id) ? 100 : (progressMap.get(b.id) ?? 0),
    }));
  }

  /** Get only the badges a user has unlocked */
  async getUserBadges(userId: number): Promise<BadgeResponseDto[]> {
    const userBadges = await this.userBadgeRepo.find({
      where: { userId },
      relations: ['badge'],
      order: { unlockedAt: 'DESC' },
    });

    return userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      slug: ub.badge.slug,
      tier: ub.badge.tier,
      criteriaType: ub.badge.criteriaType,
      threshold: ub.badge.threshold,
      sortOrder: ub.badge.sortOrder,
      unlocked: true,
      unlockedAt: ub.unlockedAt.toISOString(),
      progress: 100,
    }));
  }

  /** Check and award any earned badges after an event */
  async checkAndAward(
    userId: number,
    eventType?: BadgeCriteriaType,
  ): Promise<BadgeResponseDto[]> {
    const badges = await this.badgeRepo.find({
      where: { isActive: true },
    });

    const alreadyUnlocked = await this.userBadgeRepo.find({
      where: { userId },
      select: ['badgeId'],
    });
    const unlockedIds = new Set(alreadyUnlocked.map((ub) => ub.badgeId));

    // Only check badges matching the event type (if provided), or all
    const candidates = eventType
      ? badges.filter(
          (b) => b.criteriaType === eventType && !unlockedIds.has(b.id),
        )
      : badges.filter((b) => !unlockedIds.has(b.id));

    if (candidates.length === 0) return [];

    const newlyAwarded: BadgeResponseDto[] = [];

    for (const badge of candidates) {
      const met = await this.isCriteriaMet(userId, badge);
      if (met) {
        try {
          const ub = this.userBadgeRepo.create({
            userId,
            badgeId: badge.id,
          });
          await this.userBadgeRepo.save(ub);

          // Create alert for the user
          const alertDto: CreateAlertDto = {
            userId,
            alertType: AlertType.SYSTEM,
            title: 'Badge Unlocked!',
            message: `You earned the "${badge.name}" badge — ${badge.description}`,
            actionUrl: '/badges',
            relatedEntityType: 'badge',
            relatedEntityId: badge.id,
          };
          await this.alertsService.createAlert(alertDto);

          newlyAwarded.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            iconUrl: badge.iconUrl,
            slug: badge.slug,
            tier: badge.tier,
            criteriaType: badge.criteriaType,
            threshold: badge.threshold,
            sortOrder: badge.sortOrder,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
            progress: 100,
          });

          this.logger.log(`Badge "${badge.name}" awarded to user ${userId}`);
        } catch (err) {
          // Unique constraint — already awarded (race condition), ignore
          this.logger.warn(
            `Badge "${badge.name}" already awarded to user ${userId}: ${err}`,
          );
        }
      }
    }

    return newlyAwarded;
  }

  /** Evaluate whether a user meets a specific badge's criteria */
  private async isCriteriaMet(userId: number, badge: Badge): Promise<boolean> {
    switch (badge.criteriaType) {
      case BadgeCriteriaType.PREDICTIONS_CORRECT:
        return (await this.countCorrectPredictions(userId)) >= badge.threshold;

      case BadgeCriteriaType.PREDICTIONS_EXACT:
        return (await this.countExactPredictions(userId)) >= badge.threshold;

      case BadgeCriteriaType.FIRST_PREDICTION:
        return (await this.countTotalPredictions(userId)) >= badge.threshold;

      case BadgeCriteriaType.PREDICTIONS_STREAK:
        return (await this.getCurrentStreak(userId)) >= badge.threshold;

      case BadgeCriteriaType.FIRST_COMMENT:
      case BadgeCriteriaType.COMMENTS_TOTAL:
        return (await this.countComments(userId)) >= badge.threshold;

      case BadgeCriteriaType.FOLLOWERS_COUNT:
        return (await this.countFollowers(userId)) >= badge.threshold;

      case BadgeCriteriaType.FOLLOWING_COUNT:
        return (await this.countFollowing(userId)) >= badge.threshold;

      case BadgeCriteriaType.PRO_SUBSCRIBER:
        return this.isProSubscriber(userId);

      default:
        return false;
    }
  }

  private async countCorrectPredictions(userId: number): Promise<number> {
    return this.predictionRepo.count({
      where: { userId, points: Not(IsNull()) },
    });
  }

  private async countExactPredictions(userId: number): Promise<number> {
    return this.predictionRepo.count({
      where: { userId, points: 3 },
    });
  }

  private async countTotalPredictions(userId: number): Promise<number> {
    return this.predictionRepo.count({ where: { userId } });
  }

  private async getCurrentStreak(userId: number): Promise<number> {
    const predictions = await this.predictionRepo.find({
      where: { userId, points: Not(IsNull()) },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    let streak = 0;
    for (const p of predictions) {
      if ((p.points ?? 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private async countComments(userId: number): Promise<number> {
    return this.commentRepo.count({
      where: { userId, isDeleted: false },
    });
  }

  private async countFollowers(userId: number): Promise<number> {
    return this.followRepo.count({
      where: { followingId: userId },
    });
  }

  private async countFollowing(userId: number): Promise<number> {
    return this.followRepo.count({
      where: { followerId: userId },
    });
  }

  private async isProSubscriber(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.isPro ?? false;
  }

  /** Calculate percentage progress for each badge */
  private async getProgressMap(
    userId: number,
    badges: Badge[],
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();

    // Batch compute common counts
    const [
      correctCount,
      exactCount,
      totalPreds,
      commentCount,
      followers,
      following,
    ] = await Promise.all([
      this.countCorrectPredictions(userId),
      this.countExactPredictions(userId),
      this.countTotalPredictions(userId),
      this.countComments(userId),
      this.countFollowers(userId),
      this.countFollowing(userId),
    ]);

    for (const b of badges) {
      let current = 0;
      switch (b.criteriaType) {
        case BadgeCriteriaType.PREDICTIONS_CORRECT:
          current = correctCount;
          break;
        case BadgeCriteriaType.PREDICTIONS_EXACT:
          current = exactCount;
          break;
        case BadgeCriteriaType.FIRST_PREDICTION:
          current = totalPreds;
          break;
        case BadgeCriteriaType.FIRST_COMMENT:
        case BadgeCriteriaType.COMMENTS_TOTAL:
          current = commentCount;
          break;
        case BadgeCriteriaType.FOLLOWERS_COUNT:
          current = followers;
          break;
        case BadgeCriteriaType.FOLLOWING_COUNT:
          current = following;
          break;
        default:
          current = 0;
      }
      const pct = Math.min(100, Math.round((current / b.threshold) * 100));
      map.set(b.id, pct);
    }

    return map;
  }
}
