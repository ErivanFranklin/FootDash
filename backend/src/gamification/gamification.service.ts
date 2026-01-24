import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPrediction } from './entities/user-prediction.entity';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(UserPrediction)
    private predictionsRepository: Repository<UserPrediction>,
  ) {}

  async submitPrediction(userId: number, matchId: number, homeScore: number, awayScore: number): Promise<UserPrediction> {
    const prediction = this.predictionsRepository.create({
      userId,
      matchId,
      homeScore,
      awayScore,
    });
    return this.predictionsRepository.save(prediction);
  }
}
