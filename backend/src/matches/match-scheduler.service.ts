import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from './matches.service';
import { LiveMatchService } from './live-match.service';

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
  ) {}

  async onModuleInit() {
    // Start scheduler on application startup
    this.logger.log('Match scheduler initialized, running initial check');
    await this.checkAndUpdateLiveMatches();
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
      this.logger.error('Error in scheduled live match check:', error.message);
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
      this.logger.error('Error finding live matches:', error.message);
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
}
