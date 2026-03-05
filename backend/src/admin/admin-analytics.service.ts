import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserActivity } from '../social/entities/user-activity.entity';
import { PredictionPerformance } from '../analytics/entities/prediction-performance.entity';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly activityRepo: Repository<UserActivity>,
    @InjectRepository(PredictionPerformance)
    private readonly predPerfRepo: Repository<PredictionPerformance>,
  ) {}

  /**
   * Daily registration counts over the last N days.
   * Returns { date: string, count: number }[]
   */
  async getRegistrationTrend(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: { day: string; count: string }[] = await this.usersRepo
      .createQueryBuilder('u')
      .select("TO_CHAR(u.created_at, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('u.created_at >= :since', { since: since.toISOString() })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    // Fill in missing days with zero
    const result: { date: string; count: number }[] = [];
    const dayMs = 86400000;
    const start = new Date(since);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataMap = new Map(rows.map((r) => [r.day, Number(r.count)]));

    for (let d = new Date(start); d <= today; d = new Date(d.getTime() + dayMs)) {
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: dataMap.get(key) ?? 0 });
    }

    return result;
  }

  /**
   * Daily active user counts (users who performed at least one activity) over last N days.
   */
  async getActiveUsers(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows: { day: string; count: string }[] = await this.activityRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(a.created_at, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(DISTINCT a.user_id)', 'count')
      .where('a.created_at >= :since', { since: since.toISOString() })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    const result: { date: string; count: number }[] = [];
    const dayMs = 86400000;
    const start = new Date(since);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataMap = new Map(rows.map((r) => [r.day, Number(r.count)]));

    for (let d = new Date(start); d <= today; d = new Date(d.getTime() + dayMs)) {
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: dataMap.get(key) ?? 0 });
    }

    return result;
  }

  /**
   * Prediction accuracy grouped by model type.
   * Returns { modelType, total, correct, accuracy }[]
   */
  async getPredictionAccuracy() {
    const rows: { model_type: string; total: string; correct: string }[] =
      await this.predPerfRepo
        .createQueryBuilder('pp')
        .select('pp.model_type', 'model_type')
        .addSelect('COUNT(*)', 'total')
        .addSelect(
          "COUNT(*) FILTER (WHERE pp.was_correct = true)",
          'correct',
        )
        .where('pp.actual_outcome IS NOT NULL')
        .groupBy('pp.model_type')
        .getRawMany();

    return rows.map((r) => ({
      modelType: r.model_type,
      total: Number(r.total),
      correct: Number(r.correct),
      accuracy:
        Number(r.total) > 0
          ? Math.round((Number(r.correct) / Number(r.total)) * 10000) / 100
          : 0,
    }));
  }

  /**
   * Growth metrics: total users, pro users, and % changes vs previous period.
   */
  async getGrowthMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

    const [totalUsers, totalPro] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { isPro: true } }),
    ]);

    const [newUsersCurrent, newUsersPrevious] = await Promise.all([
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :since', { since: thirtyDaysAgo.toISOString() })
        .getCount(),
      this.usersRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :start AND u.created_at < :end', {
          start: sixtyDaysAgo.toISOString(),
          end: thirtyDaysAgo.toISOString(),
        })
        .getCount(),
    ]);

    const [activeUsersCurrent, activeUsersPrevious] = await Promise.all([
      this.activityRepo
        .createQueryBuilder('a')
        .select('COUNT(DISTINCT a.user_id)', 'count')
        .where('a.created_at >= :since', { since: thirtyDaysAgo.toISOString() })
        .getRawOne()
        .then((r) => Number(r?.count ?? 0)),
      this.activityRepo
        .createQueryBuilder('a')
        .select('COUNT(DISTINCT a.user_id)', 'count')
        .where('a.created_at >= :start AND a.created_at < :end', {
          start: sixtyDaysAgo.toISOString(),
          end: thirtyDaysAgo.toISOString(),
        })
        .getRawOne()
        .then((r) => Number(r?.count ?? 0)),
    ]);

    const calcChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return {
      totalUsers,
      totalPro,
      proRate: totalUsers > 0 ? Math.round((totalPro / totalUsers) * 10000) / 100 : 0,
      newUsers30d: newUsersCurrent,
      newUsersChange: calcChange(newUsersCurrent, newUsersPrevious),
      activeUsers30d: activeUsersCurrent,
      activeUsersChange: calcChange(activeUsersCurrent, activeUsersPrevious),
    };
  }
}
