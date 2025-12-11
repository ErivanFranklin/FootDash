import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamAnalytics } from '../entities/team-analytics.entity';
import { Team } from '../../teams/entities/team.entity';
import { Match } from '../../matches/entities/match.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';
import { InsightsGeneratorService } from './insights-generator.service';
import { TeamAnalyticsData } from '../interfaces/analytics.interface';

@Injectable()
export class TeamAnalyticsService {
  private readonly logger = new Logger(TeamAnalyticsService.name);

  constructor(
    @InjectRepository(TeamAnalytics)
    private readonly analyticsRepository: Repository<TeamAnalytics>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly formCalculator: FormCalculatorService,
    private readonly statisticalAnalysis: StatisticalAnalysisService,
    private readonly insightsGenerator: InsightsGeneratorService,
  ) {}

  /**
   * Get team analytics (from cache or calculate)
   */
  async getTeamAnalytics(
    teamId: number,
    season?: string,
  ): Promise<TeamAnalyticsData> {
    const currentSeason = season || this.getCurrentSeason();

    // Check for existing analytics
    const existing = await this.analyticsRepository.findOne({
      where: { teamId, season: currentSeason },
      relations: ['team'],
    });

    if (existing && this.isAnalyticsFresh(existing)) {
      return this.mapToDto(existing);
    }

    // Calculate new analytics
    return await this.calculateTeamAnalytics(teamId, currentSeason);
  }

  /**
   * Calculate and save team analytics
   */
  async calculateTeamAnalytics(
    teamId: number,
    season: string,
  ): Promise<TeamAnalyticsData> {
    this.logger.log(
      `Calculating analytics for team ${teamId}, season ${season}`,
    );

    // Fetch team
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Fetch all matches for the season
    const allMatches = await this.getTeamMatches(teamId, season);
    const homeMatches = allMatches.filter((m) => m.homeTeam.id === teamId);
    const awayMatches = allMatches.filter((m) => m.awayTeam.id === teamId);

    // Calculate form
    const form = this.formCalculator.calculateForm(allMatches, teamId, 5);

    // Calculate performance stats
    const homePerformance = this.statisticalAnalysis.calculatePerformanceStats(
      homeMatches,
      teamId,
      true,
    );
    const awayPerformance = this.statisticalAnalysis.calculatePerformanceStats(
      awayMatches,
      teamId,
      false,
    );
    const overallStats = this.statisticalAnalysis.calculatePerformanceStats(
      allMatches,
      teamId,
    );

    // Calculate defensive rating
    const defensiveRating = this.statisticalAnalysis.calculateDefensiveRating(
      allMatches,
      teamId,
    );

    // Calculate scoring trend
    const scoringTrend = this.statisticalAnalysis.calculateScoringTrend(
      allMatches,
      teamId,
      5,
    );

    // Create or update analytics
    let analytics = await this.analyticsRepository.findOne({
      where: { teamId, season },
    });

    if (!analytics) {
      analytics = this.analyticsRepository.create({
        teamId,
        season,
      });
    }

    analytics.formRating = form.formRating;
    analytics.homePerformance = {
      played: homePerformance.played,
      won: homePerformance.won,
      drawn: homePerformance.drawn,
      lost: homePerformance.lost,
      goalsFor: homePerformance.goalsFor,
      goalsAgainst: homePerformance.goalsAgainst,
      points: homePerformance.points,
    };
    analytics.awayPerformance = {
      played: awayPerformance.played,
      won: awayPerformance.won,
      drawn: awayPerformance.drawn,
      lost: awayPerformance.lost,
      goalsFor: awayPerformance.goalsFor,
      goalsAgainst: awayPerformance.goalsAgainst,
      points: awayPerformance.points,
    };
    analytics.scoringTrend = scoringTrend;
    analytics.defensiveRating = defensiveRating;
    analytics.overallStats = {
      totalPlayed: overallStats.played,
      totalWon: overallStats.won,
      totalDrawn: overallStats.drawn,
      totalLost: overallStats.lost,
      totalGoalsFor: overallStats.goalsFor,
      totalGoalsAgainst: overallStats.goalsAgainst,
      winPercentage: overallStats.winPercentage,
    };
    analytics.lastUpdated = new Date();

    const saved = await this.analyticsRepository.save(analytics);

    // Re-fetch with relations
    const savedWithRelations = await this.analyticsRepository.findOne({
      where: { id: saved.id },
      relations: ['team'],
    });

    if (!savedWithRelations) {
      throw new Error('Failed to save team analytics');
    }

    return this.mapToDto(savedWithRelations);
  }

  /**
   * Get team form rating
   */
  async getTeamForm(teamId: number, lastN = 5): Promise<any> {
    const matches = await this.getTeamMatches(teamId);
    const form = this.formCalculator.calculateForm(matches, teamId, lastN);

    return {
      teamId,
      formRating: form.formRating,
      recentMatches: form.matches,
      recentForm: form.recentForm,
      points: form.points,
      maxPoints: form.maxPoints,
    };
  }

  /**
   * Compare two teams
   */
  async compareTeams(
    team1Id: number,
    team2Id: number,
    season?: string,
  ): Promise<any> {
    const currentSeason = season || this.getCurrentSeason();

    const team1Analytics = await this.getTeamAnalytics(team1Id, currentSeason);
    const team2Analytics = await this.getTeamAnalytics(team2Id, currentSeason);

    // Get head-to-head
    const h2hMatches = await this.getHeadToHeadMatches(team1Id, team2Id);
    const h2h = this.statisticalAnalysis.analyzeHeadToHead(
      h2hMatches,
      team1Id,
      team2Id,
    );

    // Determine advantage
    let advantage: 'home' | 'away' | 'neutral' = 'neutral';
    if (team1Analytics.formRating > team2Analytics.formRating + 20) {
      advantage = 'home';
    } else if (team2Analytics.formRating > team1Analytics.formRating + 20) {
      advantage = 'away';
    }

    // Generate comparison insights
    const insights: string[] = [];
    insights.push(
      `Form: ${team1Analytics.teamName} (${team1Analytics.formRating.toFixed(0)}) vs ${team2Analytics.teamName} (${team2Analytics.formRating.toFixed(0)})`,
    );

    if (h2h.homeWins + h2h.awayWins + h2h.draws > 0) {
      insights.push(
        `Head-to-head: ${h2h.homeWins} wins for ${team1Analytics.teamName}, ${h2h.awayWins} for ${team2Analytics.teamName}, ${h2h.draws} draws`,
      );
    }

    return {
      homeTeam: team1Analytics,
      awayTeam: team2Analytics,
      headToHead: h2h,
      advantage,
      keyInsights: insights,
    };
  }

  /**
   * Get matches for a team in a season
   */
  private async getTeamMatches(
    teamId: number,
    season?: string,
  ): Promise<Match[]> {
    const query = this.matchRepository
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
      .andWhere('match.awayScore IS NOT NULL');

    // Filter by season if provided
    if (season) {
      // Assuming season is stored in match.league.season
      query.andWhere("match.league->>'season' = :season", { season });
    }

    return await query.orderBy('match.kickOff', 'DESC').getMany();
  }

  /**
   * Get head-to-head matches
   */
  private async getHeadToHeadMatches(
    team1Id: number,
    team2Id: number,
  ): Promise<Match[]> {
    return await this.matchRepository
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
  }

  /**
   * Get current season (simple implementation)
   */
  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Assume season starts in August (month 8)
    if (month >= 8) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Check if analytics are fresh (within 7 days)
   */
  private isAnalyticsFresh(analytics: TeamAnalytics): boolean {
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const age = Date.now() - analytics.updatedAt.getTime();
    return age < weekInMs;
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(analytics: TeamAnalytics): TeamAnalyticsData {
    return {
      teamId: analytics.teamId,
      teamName: analytics.team.name,
      season: analytics.season,
      formRating: analytics.formRating,
      homePerformance: {
        ...analytics.homePerformance,
        goalDifference:
          analytics.homePerformance.goalsFor -
          analytics.homePerformance.goalsAgainst,
        winPercentage:
          analytics.homePerformance.played > 0
            ? (analytics.homePerformance.won /
                analytics.homePerformance.played) *
              100
            : 0,
      },
      awayPerformance: {
        ...analytics.awayPerformance,
        goalDifference:
          analytics.awayPerformance.goalsFor -
          analytics.awayPerformance.goalsAgainst,
        winPercentage:
          analytics.awayPerformance.played > 0
            ? (analytics.awayPerformance.won /
                analytics.awayPerformance.played) *
              100
            : 0,
      },
      overallStats: {
        played: analytics.overallStats.totalPlayed,
        won: analytics.overallStats.totalWon,
        drawn: analytics.overallStats.totalDrawn,
        lost: analytics.overallStats.totalLost,
        goalsFor: analytics.overallStats.totalGoalsFor,
        goalsAgainst: analytics.overallStats.totalGoalsAgainst,
        goalDifference:
          analytics.overallStats.totalGoalsFor -
          analytics.overallStats.totalGoalsAgainst,
        points:
          analytics.overallStats.totalWon * 3 +
          analytics.overallStats.totalDrawn,
        winPercentage: analytics.overallStats.winPercentage,
      },
      scoringTrend: analytics.scoringTrend,
      defensiveRating: analytics.defensiveRating,
      lastUpdated: analytics.lastUpdated || analytics.updatedAt,
    };
  }

  /**
   * Refresh analytics for all teams (batch operation)
   */
  async refreshAllTeamAnalytics(season?: string): Promise<number> {
    const currentSeason = season || this.getCurrentSeason();
    const teams = await this.teamRepository.find();
    let refreshed = 0;

    for (const team of teams) {
      try {
        await this.calculateTeamAnalytics(team.id, currentSeason);
        refreshed++;
      } catch (error) {
        this.logger.warn(
          `Failed to refresh analytics for team ${team.id}:`,
          error.message,
        );
      }
    }

    this.logger.log(`Refreshed analytics for ${refreshed} teams`);
    return refreshed;
  }
}
