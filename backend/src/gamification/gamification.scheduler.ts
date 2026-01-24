import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserPrediction } from './entities/user-prediction.entity';
import { Match } from '../matches/entities/match.entity';
import { GamificationService } from './gamification.service';

@Injectable()
export class GamificationScheduler {
  private readonly logger = new Logger(GamificationScheduler.name);

  constructor(
    @InjectRepository(UserPrediction)
    private predictionsRepository: Repository<UserPrediction>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private gamificationService: GamificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processMatchResults() {
    this.logger.log('Checking for finished matches to score predictions...');

    // 1. Find distinct match IDs from pending predictions
    const pendingPredictions = await this.predictionsRepository.find({
      where: { points: IsNull() },
      select: ['matchId'],
    });

    const pendingMatchIds = [...new Set(pendingPredictions.map((p) => p.matchId))];

    if (pendingMatchIds.length === 0) {
      return;
    }

    // 2. Load those matches, filter for FINISHED status
    const matches = await this.matchesRepository.findByIds(pendingMatchIds);
    const finishedMatches = matches.filter(
      (m) => m.status === 'FINISHED' || m.status === 'FT',
    );

    if (finishedMatches.length === 0) {
      return;
    }

    this.logger.log(`Found ${finishedMatches.length} finished matches to process.`);

    // 3. Process each match
    for (const match of finishedMatches) {
        if (match.homeScore != null && match.awayScore != null) {
            await this.gamificationService.processMatchResult(match.id, match.homeScore, match.awayScore);
            this.logger.log(`Processed results for match ${match.id}`);
        }
    }
  }
}
