import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { UserPrediction } from '../gamification/entities/user-prediction.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(UserPrediction)
    private readonly predictionRepo: Repository<UserPrediction>,
  ) {}

  async getUserPredictions(userId: number) {
    const predictions = await this.predictionRepo.find({
      where: { userId },
      relations: ['match', 'match.homeTeam', 'match.awayTeam'],
      order: { createdAt: 'DESC' },
    });

    return predictions.map((p) => ({
      id: p.id,
      matchId: p.matchId,
      homeTeam: p.match?.homeTeam?.name ?? 'Unknown',
      awayTeam: p.match?.awayTeam?.name ?? 'Unknown',
      predictedHome: p.homeScore,
      predictedAway: p.awayScore,
      actualHome: p.match?.homeScore ?? null,
      actualAway: p.match?.awayScore ?? null,
      points: p.points ?? null,
      date: p.createdAt,
    }));
  }

  async getUserStats(userId: number) {
    const total = await this.predictionRepo.count({ where: { userId } });
    const scored = await this.predictionRepo.count({
      where: { userId, points: Not(IsNull()) },
    });
    const exact = await this.predictionRepo.count({
      where: { userId, points: 3 },
    });

    const sumResult = await this.predictionRepo
      .createQueryBuilder('p')
      .select('SUM(p.points)', 'total')
      .where('p.userId = :userId', { userId })
      .andWhere('p.points IS NOT NULL')
      .getRawOne();
    const totalPoints = parseInt(sumResult?.total ?? '0', 10);

    return {
      totalPredictions: total,
      scoredPredictions: scored,
      exactPredictions: exact,
      totalPoints,
      accuracy: scored > 0 ? Math.round((scored / total) * 100) : 0,
      exportedAt: new Date().toISOString(),
    };
  }

  toCsv(data: Record<string, any>[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape CSV values with commas or quotes
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
