import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchesService } from './matches.service';
import { LiveMatchService } from './live-match.service';
import { Team } from '../teams/entities/team.entity';
import { MatchRangeType } from './dto/matches-query.dto';

@Injectable()
export class MatchSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MatchSchedulerService.name);
  private readonly liveMatchWindowMinutes = parseInt(
    process.env.LIVE_MATCH_WINDOW_MINUTES || '120',
    10,
  ); // 2 hours default

  constructor(
    private readonly matchesService: MatchesService,
    private readonly liveMatchService: LiveMatchService,
    private readonly configService: ConfigService,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async onModuleInit() {
    // Start scheduler on application startup
    this.logger.log('Match scheduler initialized, running initial check');
    // Do not block API startup on external/API-dependent checks.
    setTimeout(() => {
      this.checkAndUpdateLiveMatches().catch((error) => {
        this.logger.warn(
          `Initial live-match check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }, 0);
  }

  /**
   * Daily fixture sync at 2 AM UTC for favorite teams
   * Syncs recent + upcoming fixtures to keep data fresh
   */
  @Cron('0 2 * * *') // Daily at 2 AM UTC
  async dailyFixtureSync() {
    if (this.configService.get<boolean>('FOOTBALL_API_MOCK', false)) {
      this.logger.log('Skipping daily sync - API in mock mode');
      return;
    }

    this.logger.log('Running daily fixture sync for favorite teams');

    try {
      // Get favorite teams (the ones seeded with externalIds)
      const favoriteTeams = await this.teamRepository.find({
        where: [
          { externalId: 33 },  // Manchester United
          { externalId: 40 },  // Liverpool
          { externalId: 50 },  // Manchester City
          { externalId: 529 }, // Barcelona
          { externalId: 541 }, // Real Madrid
          { externalId: 157 }, // Bayern Munich
          { externalId: 85 },  // Paris Saint-Germain
          { externalId: 131 }, // Corinthians
        ],
      });

      // Football seasons span two calendar years (e.g. 2025-2026).
      // Before August, the current season started the previous year.
      // Free plan caps at 2024, so use min(computed, 2024).
      const now = new Date();
      const computedSeason = now.getMonth() < 7
        ? now.getFullYear() - 1
        : now.getFullYear();
      const season = Math.min(computedSeason, 2024);

      let synced = 0;
      let errors = 0;

      for (const team of favoriteTeams) {
        try {
          this.logger.debug(`Syncing fixtures for ${team.name} (ext=${team.externalId})`);

          // Sync recent fixtures (last 10 matches)
          await this.matchesService.syncFixturesFromApi(team.externalId!, {
            range: MatchRangeType.RECENT,
            limit: 10,
            season,
          });

          // Sync upcoming fixtures (next 10 matches)
          await this.matchesService.syncFixturesFromApi(team.externalId!, {
            range: MatchRangeType.UPCOMING,
            limit: 10,
            season,
          });

          synced++;
          
          // Rate limit: 2s between requests (free plan = 10 req/min max)
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err: any) {
          this.logger.error(`Failed to sync ${team.name}: ${err.message}`);
          errors++;
        }
      }

      this.logger.log(`Daily sync complete: ${synced} teams synced, ${errors} errors (season ${season})`);
    } catch (error: any) {
      this.logger.error('Daily fixture sync failed:', error.message);
    }
  }

  /**
   * Check for live matches every 5 minutes
   * Uses NestJS @Cron decorator
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndUpdateLiveMatches() {
    this.logger.debug('Running scheduled check for live matches');

    try {
      const liveMatches = await this.findLiveMatches();
      const currentlyPolled = this.liveMatchService.getPolledMatches();

      // Start polling new live matches
      for (const match of liveMatches) {
        const matchId = match.id.toString();
        if (!currentlyPolled.includes(matchId)) {
          this.logger.log(`Starting polling for newly live match ${matchId}`);
          await this.liveMatchService.startPolling(matchId);
        }
      }

      // Stop polling matches that are no longer in live window
      const liveMatchIds = liveMatches.map((m) => m.id.toString());
      for (const polledId of currentlyPolled) {
        if (!liveMatchIds.includes(polledId)) {
          this.logger.log(
            `Match ${polledId} is no longer in live window, stopping polling`,
          );
          this.liveMatchService.stopPolling(polledId);
        }
      }

      this.logger.debug(
        `Live matches: ${liveMatchIds.length}, Currently polling: ${currentlyPolled.length}`,
      );
    } catch (error) {
      this.logger.error('Error in scheduled live match check:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Find matches that are currently live or about to start
   * A match is considered "live" if:
   * - Status is IN_PLAY, PAUSED, or HALFTIME
   * - OR scheduled to start within the next 15 minutes
   * - OR started within the last X minutes (liveMatchWindowMinutes)
   */
  private async findLiveMatches(): Promise<any[]> {
    try {
      const now = new Date();
      const windowStart = new Date(
        now.getTime() - this.liveMatchWindowMinutes * 60 * 1000,
      );
      const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes into future

      // Get today's matches (this is a simplified approach)
      // In production, you'd fetch from your database with proper date filtering
      const todayMatches = await this.matchesService.getMatchesByDate(
        now.toISOString().split('T')[0],
      );

      // Filter matches that are in live window
      const liveMatches = todayMatches.filter((match) => {
        // Always include matches with live status
        if (
          match.status &&
          ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(match.status)
        ) {
          return true;
        }

        // Include scheduled matches in the time window
        if (
          match.status &&
          (match.status === 'SCHEDULED' || match.status === 'TIMED')
        ) {
          if (match.kickOff) {
            const matchDate = new Date(match.kickOff);
            return matchDate >= windowStart && matchDate <= windowEnd;
          }
        }

        return false;
      });

      return liveMatches;
    } catch (error) {
      this.logger.error('Error finding live matches:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Manually trigger check (useful for testing or admin endpoints)
   */
  async triggerManualCheck() {
    this.logger.log('Manual check triggered');
    await this.checkAndUpdateLiveMatches();
  }

  /**
   * Force start polling for specific match (useful for testing)
   */
  async forceStartPolling(matchId: string) {
    this.logger.log(`Force starting polling for match ${matchId}`);
    await this.liveMatchService.startPolling(matchId);
  }

  /**
   * Force stop polling for specific match
   */
  forceStopPolling(matchId: string) {
    this.logger.log(`Force stopping polling for match ${matchId}`);
    this.liveMatchService.stopPolling(matchId);
  }

  /**
   * Get current scheduler status
   */
  getStatus() {
    return {
      currentlyPolling: this.liveMatchService.getPolledMatches(),
      liveMatchWindowMinutes: this.liveMatchWindowMinutes,
    };
  }

  // -----------------------------------------------------------------------
  // Daily fixture sync – pulls recent & upcoming fixtures for all tracked teams
  // -----------------------------------------------------------------------

  /**
   * Sync fixtures for all teams in the database.
   * Runs daily at 06:00 UTC so data is fresh before the day's matches.
   * Uses staggered requests (1-second delay) to respect API rate limits.
   */
  @Cron('0 6 * * *') // 06:00 UTC daily
  async syncAllTeamFixtures() {
    const isMock = this.configService.get<boolean>('FOOTBALL_API_MOCK', false);
    if (isMock) {
      this.logger.debug('Skipping daily sync – mock mode enabled');
      return;
    }

    this.logger.log('Starting daily fixture sync for all tracked teams');

    const teams = await this.teamRepository.find({
      where: {},
      select: ['id', 'externalId', 'name'],
    });

    // Only sync teams that have an externalId (linked to the API)
    const syncableTeams = teams.filter((t) => t.externalId);

    if (syncableTeams.length === 0) {
      this.logger.warn('No teams with externalId found – nothing to sync');
      return;
    }

    // Football seasons span two calendar years (e.g. 2025-2026).
    // Before August, the current season started the previous year.
    // Free plan caps at 2024, so use min(computed, 2024).
    const now = new Date();
    const computedSeason = now.getMonth() < 7
      ? now.getFullYear() - 1
      : now.getFullYear();
    const season = Math.min(computedSeason, 2024);

    let successCount = 0;
    let errorCount = 0;

    for (const team of syncableTeams) {
      try {
        this.logger.debug(`Syncing fixtures for ${team.name} (ext=${team.externalId})`);

        // Sync recent results + upcoming fixtures in one call
        await this.matchesService.syncFixturesFromApi(team.externalId!, {
          season,
          range: MatchRangeType.ALL,
        });

        successCount++;

        // Stagger requests: 1.5s delay between teams to stay within free-plan rate limits
        await this.sleep(1500);
      } catch (err: any) {
        errorCount++;
        this.logger.error(
          `Failed to sync fixtures for ${team.name}: ${err.message}`,
        );
      }
    }

    this.logger.log(
      `Daily sync complete: ${successCount} teams synced, ${errorCount} errors`,
    );
  }

  /**
   * Manually trigger a full sync (useful for admin endpoint / testing).
   */
  async triggerFullSync() {
    return this.syncAllTeamFixtures();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
