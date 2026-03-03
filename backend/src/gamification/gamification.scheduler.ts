import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserPrediction } from './entities/user-prediction.entity';
import { Match } from '../matches/entities/match.entity';
import { GamificationService } from './gamification.service';
import { BadgeService } from './badge.service';
import { BadgeCriteriaType } from './entities/badge.entity';

@Injectable()
export class GamificationScheduler {
  private readonly logger = new Logger(GamificationScheduler.name);

  constructor(
    @InjectRepository(UserPrediction)
    private predictionsRepository: Repository<UserPrediction>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private gamificationService: GamificationService,
    private badgeService: BadgeService,
  ) {}

  // Fallback cron — event-driven scoring via 'match.finished' handles real-time.
  // This runs hourly to catch any predictions missed by the event (e.g. cold starts).
  @Cron(CronExpression.EVERY_HOUR)
  async processMatchResults() {
    this.logger.log('Checking for finished matches to score predictions...');

    // 1. Find distinct match IDs from pending predictions
    const pendingPredictions = await this.predictionsRepository.find({
      where: { points: IsNull() },
      select: ['matchId'],
    });

    const pendingMatchIds = [...new Set(pendingPredictions.map((p) => p.matchId))];

    const affectedUserIds = new Set<number>();

    if (pendingMatchIds.length > 0) {
      // 2. Load those matches, filter for FINISHED status
      const matches = await this.matchesRepository.findByIds(pendingMatchIds);
      const finishedMatches = matches.filter(
        (m) => m.status === 'FINISHED' || m.status === 'FT',
      );

      if (finishedMatches.length > 0) {
        this.logger.log(`Found ${finishedMatches.length} finished matches to process.`);

        // 3. Process each match and check badges for affected users
        for (const match of finishedMatches) {
          if (match.homeScore != null && match.awayScore != null) {
            // Collect user IDs from predictions for this match
            const matchPredictions = await this.predictionsRepository.find({
              where: { matchId: match.id, points: IsNull() },
              select: ['userId'],
            });
            matchPredictions.forEach((p) => affectedUserIds.add(p.userId));

            await this.gamificationService.processMatchResult(match.id, match.homeScore, match.awayScore);
            this.logger.log(`Processed results for match ${match.id}`);
          }
        }
      }
    }

    // 4. Check badges for all affected users
    if (affectedUserIds.size > 0) {
      this.logger.log(`Checking badges for ${affectedUserIds.size} users...`);
      for (const userId of affectedUserIds) {
        try {
          await this.badgeService.checkAndAward(userId, BadgeCriteriaType.PREDICTIONS_CORRECT);
        } catch (err) {
          this.logger.error(`Badge check failed for user ${userId}: ${(err as Error).message}`);
        }
      }

    }

    // 5. Keep leaderboard snapshots fresh every scheduler run
    try {
      await this.gamificationService.rebuildLeaderboards(['weekly', 'monthly', 'all-time']);
    } catch (err) {
      this.logger.error(`Leaderboard rebuild failed: ${(err as Error).message}`);
    }
  }
}
