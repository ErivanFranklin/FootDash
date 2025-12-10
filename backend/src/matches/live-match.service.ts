import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchGateway } from '../websockets/match.gateway';
import { FootballApiService } from '../football-api/football-api.service';

interface MatchUpdateData {
  matchId: string;
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  status: string;
  minute?: number;
  timestamp: Date;
}

@Injectable()
export class LiveMatchService implements OnModuleDestroy {
  private readonly logger = new Logger(LiveMatchService.name);
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private lastMatchData = new Map<string, any>();
  private readonly pollInterval = parseInt(
    process.env.LIVE_MATCH_POLL_INTERVAL || '30000',
    10,
  ); // 30 seconds default

  constructor(
    private readonly matchesService: MatchesService,
    private readonly footballApiService: FootballApiService,
    private readonly matchGateway: MatchGateway,
  ) {}

  onModuleDestroy() {
    this.stopAllPolling();
  }

  /**
   * Start polling for a specific match
   */
  async startPolling(matchId: string) {
    if (this.pollingIntervals.has(matchId)) {
      this.logger.debug(`Already polling match ${matchId}`);
      return;
    }

    this.logger.log(`Starting live polling for match ${matchId}`);

    // Poll immediately, then set interval
    await this.pollMatch(matchId);

    const interval = setInterval(async () => {
      await this.pollMatch(matchId);
    }, this.pollInterval);

    this.pollingIntervals.set(matchId, interval);
  }

  /**
   * Stop polling for a specific match
   */
  stopPolling(matchId: string) {
    const interval = this.pollingIntervals.get(matchId);

    if (interval) {
      this.logger.log(`Stopping live polling for match ${matchId}`);
      clearInterval(interval);
      this.pollingIntervals.delete(matchId);
      this.lastMatchData.delete(matchId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling() {
    this.logger.log('Stopping all live match polling');
    this.pollingIntervals.forEach((interval, matchId) => {
      clearInterval(interval);
      this.logger.debug(`Stopped polling match ${matchId}`);
    });
    this.pollingIntervals.clear();
    this.lastMatchData.clear();
  }

  /**
   * Get currently polled matches
   */
  getPolledMatches(): string[] {
    return Array.from(this.pollingIntervals.keys());
  }

  /**
   * Poll a single match and broadcast if changed
   */
  private async pollMatch(matchId: string) {
    try {
      // Fetch latest match data from API
      const match = await this.footballApiService.getMatch(
        parseInt(matchId, 10),
      );

      if (!match) {
        this.logger.warn(`Match ${matchId} not found`);
        this.stopPolling(matchId);
        return;
      }

      // Check if match is finished
      if (
        match.status === 'FINISHED' ||
        match.status === 'POSTPONED' ||
        match.status === 'CANCELLED'
      ) {
        this.logger.log(
          `Match ${matchId} is ${match.status}, stopping polling`,
        );

        // Send final update
        this.broadcastMatchUpdate(matchId, match);

        // Stop polling this match
        this.stopPolling(matchId);
        return;
      }

      // Check if data has changed since last poll
      if (this.hasMatchDataChanged(matchId, match)) {
        this.logger.log(`Match ${matchId} data changed, broadcasting update`);
        this.broadcastMatchUpdate(matchId, match);
        this.lastMatchData.set(matchId, match);
      } else {
        this.logger.debug(`No changes for match ${matchId}`);
      }
    } catch (error) {
      this.logger.error(`Error polling match ${matchId}:`, error.message);

      // If error persists, we might want to stop polling after X failures
      // For now, just log and continue
    }
  }

  /**
   * Check if match data has significantly changed
   */
  private hasMatchDataChanged(matchId: string, newData: any): boolean {
    const lastData = this.lastMatchData.get(matchId);

    if (!lastData) {
      return true; // First time seeing this match
    }

    // Check for score changes
    const scoreChanged =
      lastData.score?.fullTime?.home !== newData.score?.fullTime?.home ||
      lastData.score?.fullTime?.away !== newData.score?.fullTime?.away ||
      lastData.score?.halfTime?.home !== newData.score?.halfTime?.home ||
      lastData.score?.halfTime?.away !== newData.score?.halfTime?.away;

    // Check for status changes
    const statusChanged = lastData.status !== newData.status;

    // Check for minute changes (minute is optional)
    const minuteChanged = lastData.minute !== newData.minute;

    return scoreChanged || statusChanged || minuteChanged;
  }

  /**
   * Broadcast match update via WebSocket
   */
  private broadcastMatchUpdate(matchId: string, matchData: any) {
    const update: MatchUpdateData = {
      matchId: matchId.toString(),
      score: {
        fullTime: {
          home: matchData.score?.fullTime?.home ?? null,
          away: matchData.score?.fullTime?.away ?? null,
        },
        halfTime: {
          home: matchData.score?.halfTime?.home ?? null,
          away: matchData.score?.halfTime?.away ?? null,
        },
      },
      status: matchData.status,
      minute: matchData.minute,
      timestamp: new Date(),
    };

    this.matchGateway.broadcastMatchUpdate(matchId, update);
  }
}
