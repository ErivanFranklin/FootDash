import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPrediction } from './entities/user-prediction.entity';
import { MatchFinishedEvent } from '../matches/events/match-finished.event';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(UserPrediction)
    private predictionsRepository: Repository<UserPrediction>,
  ) {}

  @OnEvent('match.finished')
  async onMatchFinished(event: MatchFinishedEvent): Promise<void> {
    this.logger.log(`[Event] match.finished → matchId=${event.matchId}, score=${event.homeScore}-${event.awayScore}`);
    await this.processMatchResult(event.matchId, event.homeScore, event.awayScore);
  }

  async submitPrediction(userId: number, matchId: number, homeScore: number, awayScore: number): Promise<UserPrediction> {
    const prediction = this.predictionsRepository.create({
      userId,
      matchId,
      homeScore,
      awayScore,
    });
    return this.predictionsRepository.save(prediction);
  }

  calculatePoints(userHome: number, userAway: number, actualHome: number, actualAway: number): number {
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

  async processMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<void> {
    const predictions = await this.predictionsRepository.find({ where: { matchId } });

    for (const pred of predictions) {
      const points = this.calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
      pred.points = points;
      await this.predictionsRepository.save(pred);
    }
  }
}
