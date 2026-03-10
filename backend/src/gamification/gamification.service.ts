import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPrediction } from './entities/user-prediction.entity';
import { Leaderboard } from './entities/leaderboard.entity';
import { MatchFinishedEvent } from '../matches/events/match-finished.event';
import { User } from '../users/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Match } from '../matches/entities/match.entity';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(UserPrediction)
    private predictionsRepository: Repository<UserPrediction>,
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  private async scorePendingPredictionsForFinishedMatches(): Promise<void> {
    const pendingPredictions = await this.predictionsRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.matchId', 'matchId')
      .where('p.points IS NULL')
      .getRawMany<{ matchId: string }>();

    if (!pendingPredictions.length) {
      return;
    }

    const pendingMatchIds = pendingPredictions
      .map((item) => Number(item.matchId))
      .filter((id) => Number.isFinite(id));

    if (!pendingMatchIds.length) {
      return;
    }

    const matches = await this.matchesRepository
      .createQueryBuilder('m')
      .where('m.id IN (:...pendingMatchIds)', { pendingMatchIds })
      .andWhere('(m.status = :finished OR m.status = :ft)', {
        finished: 'FINISHED',
        ft: 'FT',
      })
      .andWhere('m.homeScore IS NOT NULL')
      .andWhere('m.awayScore IS NOT NULL')
      .getMany();

    for (const match of matches) {
      if (match.homeScore == null || match.awayScore == null) {
        continue;
      }

      await this.processMatchResult(match.id, match.homeScore, match.awayScore);
    }
  }

  private getPeriodIdentifier(
    period: 'weekly' | 'monthly' | 'all-time',
    date = new Date(),
  ): string {
    if (period === 'all-time') {
      return 'all-time';
    }

    if (period === 'monthly') {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }

    // ISO week identifier: YYYY-Www
    const target = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayNum = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  private getPeriodStart(
    period: 'weekly' | 'monthly' | 'all-time',
    now = new Date(),
  ): Date | null {
    if (period === 'all-time') return null;

    if (period === 'monthly') {
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
      );
    }

    // Weekly starts on Monday (ISO)
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const day = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - (day - 1));
    return start;
  }

  async rebuildLeaderboards(
    periods: Array<'weekly' | 'monthly' | 'all-time'> = [
      'weekly',
      'monthly',
      'all-time',
    ],
  ) {
    await this.scorePendingPredictionsForFinishedMatches();

    const now = new Date();
    const result: Array<{
      period: 'weekly' | 'monthly' | 'all-time';
      periodIdentifier: string;
      rows: number;
    }> = [];

    for (const period of periods) {
      const periodIdentifier = this.getPeriodIdentifier(period, now);
      const periodStart = this.getPeriodStart(period, now);

      const qb = this.predictionsRepository
        .createQueryBuilder('p')
        .select('p.userId', 'userId')
        .addSelect('SUM(p.points)', 'points')
        .where('p.points IS NOT NULL')
        .groupBy('p.userId')
        .orderBy('SUM(p.points)', 'DESC')
        .addOrderBy('p.userId', 'ASC');

      if (periodStart) {
        qb.andWhere('p.createdAt >= :periodStart', { periodStart });
      }

      const aggregates = await qb.getRawMany<{
        userId: string;
        points: string;
      }>();

      await this.leaderboardRepository.delete({ period, periodIdentifier });

      if (aggregates.length > 0) {
        const rows = aggregates.map((item, index) =>
          this.leaderboardRepository.create({
            userId: Number(item.userId),
            points: Number(item.points),
            rank: index + 1,
            period,
            periodIdentifier,
          }),
        );
        await this.leaderboardRepository.save(rows);
      }

      result.push({ period, periodIdentifier, rows: aggregates.length });
    }

    this.logger.log(`Leaderboard rebuild completed: ${JSON.stringify(result)}`);
    return { success: true, rebuilt: result };
  }

  async getLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'weekly') {
    const normalizedPeriod =
      period === 'monthly' || period === 'all-time' ? period : 'weekly';

    const latestPeriod = await this.leaderboardRepository
      .createQueryBuilder('lb')
      .select('MAX(lb.periodIdentifier)', 'maxPeriod')
      .where('lb.period = :period', { period: normalizedPeriod })
      .getRawOne<{ maxPeriod: string | null }>();

    const qb = this.leaderboardRepository
      .createQueryBuilder('lb')
      .leftJoin(User, 'u', 'u.id = lb.userId')
      .leftJoin(UserProfile, 'up', 'up.userId = lb.userId')
      .where('lb.period = :period', { period: normalizedPeriod })
      .select('lb.rank', 'rank')
      .addSelect('lb.userId', 'userId')
      .addSelect('lb.points', 'points')
      .addSelect('u.email', 'email')
      .addSelect('up.displayName', 'displayName')
      .addSelect('up.avatarUrl', 'avatarUrl');

    if (latestPeriod?.maxPeriod) {
      qb.andWhere('lb.periodIdentifier = :periodIdentifier', {
        periodIdentifier: latestPeriod.maxPeriod,
      });
    }

    const rows = await qb
      .orderBy('lb.rank', 'ASC')
      .addOrderBy('lb.points', 'DESC')
      .getRawMany();

    return rows.map((row) => {
      const email = String(row.email ?? 'user@example.com');
      const fallbackName = email.includes('@') ? email.split('@')[0] : email;
      return {
        rank: Number(row.rank ?? 0),
        userId: Number(row.userId ?? 0),
        userName: String(row.displayName ?? fallbackName),
        points: Number(row.points ?? 0),
        avatarUrl: row.avatarUrl ?? undefined,
      };
    });
  }

  @OnEvent('match.finished')
  async onMatchFinished(event: MatchFinishedEvent): Promise<void> {
    this.logger.log(
      `[Event] match.finished → matchId=${event.matchId}, score=${event.homeScore}-${event.awayScore}`,
    );
    await this.processMatchResult(
      event.matchId,
      event.homeScore,
      event.awayScore,
    );
    await this.rebuildLeaderboards(['weekly', 'monthly', 'all-time']);
  }

  async submitPrediction(
    userId: number,
    matchId: number,
    homeScore: number,
    awayScore: number,
  ): Promise<UserPrediction> {
    const prediction = this.predictionsRepository.create({
      userId,
      matchId,
      homeScore,
      awayScore,
    });
    return this.predictionsRepository.save(prediction);
  }

  calculatePoints(
    userHome: number,
    userAway: number,
    actualHome: number,
    actualAway: number,
  ): number {
    if (userHome === actualHome && userAway === actualAway) {
      return 3; // Exact score
    }

    const userSign = Math.sign(userHome - userAway);
    const actualSign = Math.sign(actualHome - actualAway);

    if (userSign === actualSign) {
      return 1; // Correct outcome
    }

    return 0; // Incorrect
  }

  async processMatchResult(
    matchId: number,
    homeScore: number,
    awayScore: number,
  ): Promise<void> {
    const predictions = await this.predictionsRepository.find({
      where: { matchId },
    });

    for (const pred of predictions) {
      const points = this.calculatePoints(
        pred.homeScore,
        pred.awayScore,
        homeScore,
        awayScore,
      );
      pred.points = points;
      await this.predictionsRepository.save(pred);
    }
  }
}
