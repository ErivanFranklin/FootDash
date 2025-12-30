import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MatchPrediction,
  PredictionConfidence,
} from '../entities/match-prediction.entity';
import { Match } from '../../matches/entities/match.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { InsightsGeneratorService } from './insights-generator.service';
import { PredictionResult } from '../interfaces/analytics.interface';

@Injectable()
export class MatchPredictionService {
  private readonly logger = new Logger(MatchPredictionService.name);
  private readonly HOME_ADVANTAGE = 10; // 10% boost for home team

  constructor(
    @InjectRepository(MatchPrediction)
    private readonly predictionRepository: Repository<MatchPrediction>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly formCalculator: FormCalculatorService,
    private readonly statisticalAnalysis: StatisticalAnalysisService,
    private readonly insightsGenerator: InsightsGeneratorService,
  ) {}

  /**
   * Get prediction for a match (from cache or generate new)
   */
  async getPrediction(
    matchId: number,
    forceRecalculate = false,
  ): Promise<PredictionResult> {
    // Check for existing prediction (unless forcing recalculation)
    if (!forceRecalculate) {
      const existing = await this.predictionRepository.findOne({
        where: { matchId },
        relations: ['match', 'match.homeTeam', 'match.awayTeam'],
      });

      if (existing && this.isPredictionFresh(existing)) {
        return this.mapToDto(existing);
      }
    }

    // Generate new prediction
    return await this.generatePrediction(matchId);
  }

  /**
   * Generate a new prediction for a match
   */
  async generatePrediction(matchId: number): Promise<PredictionResult> {
    this.logger.log(`Generating prediction for match ${matchId}`);

    // Fetch the match
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['homeTeam', 'awayTeam'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const homeTeamId = match.homeTeam.id;
    const awayTeamId = match.awayTeam.id;

    // Fetch recent matches for both teams
    const homeMatches = await this.getRecentMatches(homeTeamId, 10);
    const awayMatches = await this.getRecentMatches(awayTeamId, 10);
    const h2hMatches = await this.getHeadToHeadMatches(homeTeamId, awayTeamId);

    // Calculate form ratings
    const homeForm = this.formCalculator.calculateForm(
      homeMatches,
      homeTeamId,
      5,
    );
    const awayForm = this.formCalculator.calculateForm(
      awayMatches,
      awayTeamId,
      5,
    );

    // Calculate performance stats
    const homeStats = this.statisticalAnalysis.calculatePerformanceStats(
      homeMatches,
      homeTeamId,
    );
    const awayStats = this.statisticalAnalysis.calculatePerformanceStats(
      awayMatches,
      awayTeamId,
    );

    // Analyze head-to-head
    const h2h = this.statisticalAnalysis.analyzeHeadToHead(
      h2hMatches,
      homeTeamId,
      awayTeamId,
    );

    // Calculate probabilities
    const probabilities = this.calculateProbabilities({
      homeFormRating: homeForm.formRating,
      awayFormRating: awayForm.formRating,
      homeWinRate: homeStats.winPercentage,
      awayWinRate: awayStats.winPercentage,
      h2hHomeWins: h2h.homeWins,
      h2hAwayWins: h2h.awayWins,
      h2hDraws: h2h.draws,
    });

    // Generate insights
    const insights = this.insightsGenerator.generateMatchInsights({
      homeForm,
      awayForm,
      homeStats,
      awayStats,
      h2h,
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
    });

    // Determine confidence
    const confidenceLevel = this.insightsGenerator.determineConfidence({
      homeMatchCount: homeMatches.length,
      awayMatchCount: awayMatches.length,
      h2hCount: h2hMatches.length,
      formConsistency: (homeForm.formRating + awayForm.formRating) / 2,
    });

    // Map string confidence to enum
    const confidenceEnum =
      confidenceLevel === 'low'
        ? PredictionConfidence.LOW
        : confidenceLevel === 'medium'
          ? PredictionConfidence.MEDIUM
          : PredictionConfidence.HIGH;

    // Save prediction
    const prediction = this.predictionRepository.create({
      matchId,
      homeWinProbability: probabilities.homeWin,
      drawProbability: probabilities.draw,
      awayWinProbability: probabilities.awayWin,
      confidence: confidenceEnum,
      insights,
      metadata: {
        homeFormRating: homeForm.formRating,
        awayFormRating: awayForm.formRating,
        headToHeadWins: {
          home: h2h.homeWins,
          away: h2h.awayWins,
          draws: h2h.draws,
        },
        dataQuality: `${homeMatches.length + awayMatches.length} matches analyzed`,
      },
    });

    const saved = await this.predictionRepository.save(prediction);

    // Re-fetch with relations for DTO mapping
    const savedWithRelations = await this.predictionRepository.findOne({
      where: { id: saved.id },
      relations: ['match', 'match.homeTeam', 'match.awayTeam'],
    });

    if (!savedWithRelations) {
      throw new Error('Failed to save prediction');
    }

    return this.mapToDto(savedWithRelations);
  }

  /**
   * Calculate win/draw/loss probabilities using statistical model
   */
  private calculateProbabilities(params: {
    homeFormRating: number;
    awayFormRating: number;
    homeWinRate: number;
    awayWinRate: number;
    h2hHomeWins: number;
    h2hAwayWins: number;
    h2hDraws: number;
  }): { homeWin: number; draw: number; awayWin: number } {
    const {
      homeFormRating,
      awayFormRating,
      homeWinRate,
      awayWinRate,
      h2hHomeWins,
      h2hAwayWins,
      h2hDraws,
    } = params;

    // Calculate base scores (0-100)
    let homeScore =
      homeFormRating * 0.4 + homeWinRate * 0.4 + this.HOME_ADVANTAGE;
    let awayScore = awayFormRating * 0.4 + awayWinRate * 0.4;

    // Adjust based on head-to-head if available
    const totalH2H = h2hHomeWins + h2hAwayWins + h2hDraws;
    if (totalH2H > 0) {
      const h2hHomePercent = (h2hHomeWins / totalH2H) * 100;
      const h2hAwayPercent = (h2hAwayWins / totalH2H) * 100;

      homeScore += h2hHomePercent * 0.2;
      awayScore += h2hAwayPercent * 0.2;
    }

    // Normalize to ensure sum is ~100
    const total = homeScore + awayScore;
    const winProbabilitySpace = 75; // Reserve 25% for draw probability

    let homeWin = (homeScore / total) * winProbabilitySpace;
    let awayWin = (awayScore / total) * winProbabilitySpace;
    let draw = 100 - (homeWin + awayWin);

    // Ensure draw probability is reasonable (15-30%)
    if (draw < 15) {
      const adjustment = (15 - draw) / 2;
      homeWin -= adjustment;
      awayWin -= adjustment;
      draw = 15;
    } else if (draw > 30) {
      const adjustment = (draw - 30) / 2;
      homeWin += adjustment;
      awayWin += adjustment;
      draw = 30;
    }

    // Round to 2 decimal places
    return {
      homeWin: Math.round(homeWin * 100) / 100,
      draw: Math.round(draw * 100) / 100,
      awayWin: Math.round(awayWin * 100) / 100,
    };
  }

  /**
   * Get recent matches for a team
   */
  private async getRecentMatches(teamId: number, limit = 10): Promise<Match[]> {
    const matches = await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('(match.homeTeam = :teamId OR match.awayTeam = :teamId)', {
        teamId,
      })
      .andWhere('match.status IN (:...statuses)', {
        statuses: ['FINISHED', 'FT'],
      })
      .andWhere('match.homeScore IS NOT NULL')
      .andWhere('match.awayScore IS NOT NULL')
      .orderBy('match.kickOff', 'DESC')
      .limit(limit)
      .getMany();

    return matches;
  }

  /**
   * Get head-to-head matches between two teams
   */
  private async getHeadToHeadMatches(
    team1Id: number,
    team2Id: number,
  ): Promise<Match[]> {
    const matches = await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where(
        '((match.homeTeam = :team1Id AND match.awayTeam = :team2Id) OR (match.homeTeam = :team2Id AND match.awayTeam = :team1Id))',
        { team1Id, team2Id },
      )
      .andWhere('match.status IN (:...statuses)', {
        statuses: ['FINISHED', 'FT'],
      })
      .orderBy('match.kickOff', 'DESC')
      .limit(10)
      .getMany();

    return matches;
  }

  /**
   * Check if prediction is still fresh (within 24 hours)
   */
  private isPredictionFresh(prediction: MatchPrediction): boolean {
    const dayInMs = 24 * 60 * 60 * 1000;
    const age = Date.now() - prediction.updatedAt.getTime();
    return age < dayInMs;
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(prediction: MatchPrediction): PredictionResult {
    const probabilities = [
      { type: 'home', value: prediction.homeWinProbability },
      { type: 'draw', value: prediction.drawProbability },
      { type: 'away', value: prediction.awayWinProbability },
    ];

    const mostLikely = probabilities.reduce((max, curr) =>
      curr.value > max.value ? curr : max,
    ).type as 'home' | 'draw' | 'away';

    return {
      matchId: prediction.matchId,
      homeTeam: prediction.match.homeTeam.name,
      awayTeam: prediction.match.awayTeam.name,
      homeWinProbability: prediction.homeWinProbability,
      drawProbability: prediction.drawProbability,
      awayWinProbability: prediction.awayWinProbability,
      confidence: prediction.confidence,
      insights: prediction.insights || [],
      mostLikely,
      createdAt: prediction.createdAt,
    };
  }

  /**
   * Get upcoming predictions (matches in the next 7 days)
   */
  async getUpcomingPredictions(limit = 10): Promise<PredictionResult[]> {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingMatches = await this.matchRepository
      .createQueryBuilder('match')
      .where('match.kickOff > :now', { now })
      .andWhere('match.kickOff < :weekFromNow', { weekFromNow })
      .andWhere('match.status NOT IN (:...statuses)', {
        statuses: ['FINISHED', 'FT', 'CANCELLED'],
      })
      .orderBy('match.kickOff', 'ASC')
      .limit(limit)
      .getMany();

    const predictions: PredictionResult[] = [];

    for (const match of upcomingMatches) {
      try {
        const prediction = await this.getPrediction(match.id);
        predictions.push(prediction);
      } catch (error) {
        this.logger.warn(
          `Failed to generate prediction for match ${match.id}:`,
          error.message,
        );
      }
    }

    return predictions;
  }

  /**
   * Get match data for ML prediction service
   */
  async getMatchDataForPrediction(matchId: number) {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['homeTeam', 'awayTeam', 'league'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const homeTeamId = match.homeTeam.id;
    const awayTeamId = match.awayTeam.id;

    // Fetch recent matches for both teams
    const homeMatches = await this.getRecentMatches(homeTeamId, 10);
    const awayMatches = await this.getRecentMatches(awayTeamId, 10);
    const h2hMatches = await this.getHeadToHeadMatches(homeTeamId, awayTeamId);

    // Calculate form ratings
    const homeForm = this.formCalculator.calculateForm(
      homeMatches,
      homeTeamId,
      5,
    );
    const awayForm = this.formCalculator.calculateForm(
      awayMatches,
      awayTeamId,
      5,
    );

    // Calculate performance stats
    const homeStats = this.statisticalAnalysis.calculatePerformanceStats(
      homeMatches,
      homeTeamId,
    );
    const awayStats = this.statisticalAnalysis.calculatePerformanceStats(
      awayMatches,
      awayTeamId,
    );

    // Analyze head-to-head
    const h2h = this.statisticalAnalysis.analyzeHeadToHead(
      h2hMatches,
      homeTeamId,
      awayTeamId,
    );

    return {
      match,
      homeForm,
      awayForm,
      homeStats,
      awayStats,
      h2h,
      matchDetails: {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        season: match.season || new Date().getFullYear().toString(),
        kickOff: match.kickOff,
      }
    };
  }
}
