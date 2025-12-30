import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Team } from '../../teams/entities/team.entity';
import { FormCalculatorService } from './form-calculator.service';
import { StatisticalAnalysisService } from './statistical-analysis.service';

export interface TrainingDataExportParams {
  seasons?: string[];
  leagues?: number[];
  includeOngoing?: boolean;
  startDate?: Date;
  endDate?: Date;
  minMatchesPerTeam?: number;
  format?: 'json' | 'csv';
}

export interface TrainingDataPoint {
  // Match identifiers
  match_id: number;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  season: string;
  match_date: string;
  
  // Target variable (what we're predicting)
  outcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  
  // Home team features
  home_form_rating: number;
  home_win_rate: number;
  home_goals_avg: number;
  home_goals_conceded_avg: number;
  home_recent_form: string; // 'WWLDW' format
  
  // Away team features  
  away_form_rating: number;
  away_win_rate: number;
  away_goals_avg: number;
  away_goals_conceded_avg: number;
  away_recent_form: string;
  
  // Head-to-head features
  h2h_home_wins: number;
  h2h_away_wins: number;
  h2h_draws: number;
  
  // Engineered features
  form_difference: number;
  goal_difference: number;
  defensive_strength_difference: number;
  h2h_advantage: number;
  
  // Contextual features
  is_home: boolean;
  days_since_last_match: number;
  league_strength: number;
  season_stage: number;
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly formCalculator: FormCalculatorService,
    private readonly statisticalAnalysis: StatisticalAnalysisService,
  ) {}

  /**
   * Export training data for ML model training
   */
  async exportTrainingData(params: TrainingDataExportParams = {}): Promise<{
    data: TrainingDataPoint[];
    metadata: {
      total_matches: number;
      date_range: { start: string; end: string };
      leagues: number[];
      seasons: string[];
      export_timestamp: string;
    };
  }> {
    this.logger.log('Starting training data export...');

    const {
      seasons,
      leagues,
      includeOngoing = false,
      startDate,
      endDate,
      minMatchesPerTeam = 5,
    } = params;

    // Build query for finished matches
    let query = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .leftJoinAndSelect('match.league', 'league')
      .where('match.status IN (:...statuses)', {
        statuses: includeOngoing 
          ? ['FINISHED', 'FT', 'LIVE', 'HT'] 
          : ['FINISHED', 'FT']
      })
      .andWhere('match.homeScore IS NOT NULL')
      .andWhere('match.awayScore IS NOT NULL');

    // Apply filters
    if (seasons && seasons.length > 0) {
      query.andWhere('match.season IN (:...seasons)', { seasons });
    }

    if (leagues && leagues.length > 0) {
      query.andWhere('match.league.id IN (:...leagues)', { leagues });
    }

    if (startDate) {
      query.andWhere('match.kickOff >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('match.kickOff <= :endDate', { endDate });
    }

    // Order by date for consistent processing
    query.orderBy('match.kickOff', 'ASC');

    const matches = await query.getMany();
    this.logger.log(`Found ${matches.length} matches for export`);

    if (matches.length === 0) {
      throw new BadRequestException('No matches found with the specified criteria');
    }

    // Filter teams with sufficient match history
    const teamMatchCounts = await this.getTeamMatchCounts(matches.map(m => m.id));
    const eligibleTeams = Object.keys(teamMatchCounts)
      .filter(teamId => teamMatchCounts[teamId] >= minMatchesPerTeam)
      .map(id => parseInt(id));

    this.logger.log(`${eligibleTeams.length} teams have sufficient match history (>= ${minMatchesPerTeam} matches)`);

    // Process matches to create training data points
    const trainingData: TrainingDataPoint[] = [];
    
    for (const match of matches) {
      // Skip if either team doesn't have enough history
      if (!eligibleTeams.includes(match.homeTeam.id) || 
          !eligibleTeams.includes(match.awayTeam.id)) {
        continue;
      }

      try {
        const dataPoint = await this.createTrainingDataPoint(match);
        trainingData.push(dataPoint);
      } catch (error) {
        this.logger.warn(`Failed to create training data for match ${match.id}: ${error.message}`);
      }
    }

    this.logger.log(`Generated ${trainingData.length} training data points`);

    // Generate metadata
    const dateRange = {
      start: matches[0]?.kickOff?.toISOString() || '',
      end: matches[matches.length - 1]?.kickOff?.toISOString() || ''
    };

    const uniqueLeagues = [...new Set(matches.map(m => m.league?.id).filter(Boolean))];
    const uniqueSeasons = [...new Set(matches.map(m => m.season).filter(Boolean))];

    return {
      data: trainingData,
      metadata: {
        total_matches: trainingData.length,
        date_range: dateRange,
        leagues: uniqueLeagues,
        seasons: uniqueSeasons,
        export_timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create a single training data point from a match
   */
  private async createTrainingDataPoint(match: Match): Promise<TrainingDataPoint> {
    const homeTeamId = match.homeTeam.id;
    const awayTeamId = match.awayTeam.id;

    // Get historical matches up to this match date
    const homeMatches = await this.getHistoricalMatches(homeTeamId, match.kickOff, 20);
    const awayMatches = await this.getHistoricalMatches(awayTeamId, match.kickOff, 20);
    const h2hMatches = await this.getHistoricalH2H(homeTeamId, awayTeamId, match.kickOff);

    // Calculate features at the time of the match
    const homeForm = this.formCalculator.calculateForm(homeMatches, homeTeamId, 5);
    const awayForm = this.formCalculator.calculateForm(awayMatches, awayTeamId, 5);

    const homeStats = this.statisticalAnalysis.calculatePerformanceStats(homeMatches, homeTeamId);
    const awayStats = this.statisticalAnalysis.calculatePerformanceStats(awayMatches, awayTeamId);

    const h2h = this.statisticalAnalysis.analyzeHeadToHead(h2hMatches, homeTeamId, awayTeamId);

    // Determine outcome
    let outcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    if (match.homeScore > match.awayScore) {
      outcome = 'HOME_WIN';
    } else if (match.homeScore < match.awayScore) {
      outcome = 'AWAY_WIN';
    } else {
      outcome = 'DRAW';
    }

    // Create training data point
    return {
      // Match identifiers
      match_id: match.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      league_id: match.league?.id || 0,
      season: match.season || new Date().getFullYear().toString(),
      match_date: match.kickOff.toISOString(),
      
      // Target variable
      outcome,
      
      // Home team features
      home_form_rating: homeForm.formRating || 50,
      home_win_rate: homeStats.winPercentage || 50,
      home_goals_avg: homeStats.goalsPerGame || 1.0,
      home_goals_conceded_avg: homeStats.goalsConcededPerGame || 1.0,
      home_recent_form: homeForm.recentResults?.join('') || '',
      
      // Away team features
      away_form_rating: awayForm.formRating || 50,
      away_win_rate: awayStats.winPercentage || 50,
      away_goals_avg: awayStats.goalsPerGame || 1.0,
      away_goals_conceded_avg: awayStats.goalsConcededPerGame || 1.0,
      away_recent_form: awayForm.recentResults?.join('') || '',
      
      // Head-to-head features
      h2h_home_wins: h2h.homeWins || 0,
      h2h_away_wins: h2h.awayWins || 0,
      h2h_draws: h2h.draws || 0,
      
      // Engineered features
      form_difference: (homeForm.formRating || 50) - (awayForm.formRating || 50),
      goal_difference: (homeStats.goalsPerGame || 1) - (awayStats.goalsPerGame || 1),
      defensive_strength_difference: (awayStats.goalsConcededPerGame || 1) - (homeStats.goalsConcededPerGame || 1),
      h2h_advantage: this.calculateH2HAdvantage(h2h),
      
      // Contextual features
      is_home: true,
      days_since_last_match: this.calculateDaysSinceLastMatch(homeMatches, awayMatches, match.kickOff),
      league_strength: this.getLeagueStrength(match.league?.id),
      season_stage: this.getSeasonStage(match.kickOff)
    };
  }

  /**
   * Get historical matches for a team before a specific date
   */
  private async getHistoricalMatches(teamId: number, beforeDate: Date, limit = 20): Promise<Match[]> {
    return await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('(match.homeTeam.id = :teamId OR match.awayTeam.id = :teamId)', { teamId })
      .andWhere('match.kickOff < :beforeDate', { beforeDate })
      .andWhere('match.status IN (:...statuses)', { statuses: ['FINISHED', 'FT'] })
      .andWhere('match.homeScore IS NOT NULL')
      .andWhere('match.awayScore IS NOT NULL')
      .orderBy('match.kickOff', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get historical head-to-head matches before a specific date
   */
  private async getHistoricalH2H(homeTeamId: number, awayTeamId: number, beforeDate: Date): Promise<Match[]> {
    return await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('((match.homeTeam.id = :homeTeamId AND match.awayTeam.id = :awayTeamId) OR (match.homeTeam.id = :awayTeamId AND match.awayTeam.id = :homeTeamId))', 
        { homeTeamId, awayTeamId })
      .andWhere('match.kickOff < :beforeDate', { beforeDate })
      .andWhere('match.status IN (:...statuses)', { statuses: ['FINISHED', 'FT'] })
      .andWhere('match.homeScore IS NOT NULL')
      .andWhere('match.awayScore IS NOT NULL')
      .orderBy('match.kickOff', 'DESC')
      .limit(10)
      .getMany();
  }

  /**
   * Get team match counts for filtering
   */
  private async getTeamMatchCounts(matchIds: number[]): Promise<Record<number, number>> {
    if (matchIds.length === 0) return {};

    const result = await this.matchRepository
      .createQueryBuilder('match')
      .select('team_id, COUNT(*) as match_count')
      .from(subQuery => {
        return subQuery
          .select('match.homeTeam.id', 'team_id')
          .from(Match, 'match')
          .where('match.id IN (:...matchIds)', { matchIds })
          .union(
            subQuery
              .select('match.awayTeam.id', 'team_id')
              .from(Match, 'match')
              .where('match.id IN (:...matchIds)', { matchIds })
          );
      }, 'teams')
      .groupBy('team_id')
      .getRawMany();

    const counts: Record<number, number> = {};
    result.forEach(row => {
      counts[parseInt(row.team_id)] = parseInt(row.match_count);
    });

    return counts;
  }

  /**
   * Calculate head-to-head advantage
   */
  private calculateH2HAdvantage(h2h: any): number {
    const total = (h2h.homeWins || 0) + (h2h.awayWins || 0) + (h2h.draws || 0);
    if (total === 0) return 0;
    return ((h2h.homeWins || 0) - (h2h.awayWins || 0)) / total;
  }

  /**
   * Calculate days since last match
   */
  private calculateDaysSinceLastMatch(homeMatches: Match[], awayMatches: Match[], matchDate: Date): number {
    const homeLastMatch = homeMatches[0]?.kickOff;
    const awayLastMatch = awayMatches[0]?.kickOff;
    
    const lastMatch = homeLastMatch && awayLastMatch
      ? new Date(Math.max(homeLastMatch.getTime(), awayLastMatch.getTime()))
      : homeLastMatch || awayLastMatch;

    if (!lastMatch) return 14; // Default if no previous matches

    const daysDiff = Math.floor((matchDate.getTime() - lastMatch.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysDiff, 30); // Cap at 30 days
  }

  /**
   * Get league strength rating (simplified)
   */
  private getLeagueStrength(leagueId?: number): number {
    const leagueStrengths: Record<number, number> = {
      39: 1.0,    // Premier League
      140: 0.95,  // La Liga
      78: 0.95,   // Bundesliga
      135: 0.9,   // Serie A
      61: 0.85,   // Ligue 1
    };
    
    return leagueStrengths[leagueId] || 0.7;
  }

  /**
   * Get season stage (0 = early, 0.5 = mid, 1 = late)
   */
  private getSeasonStage(matchDate: Date): number {
    const month = matchDate.getMonth() + 1; // 1-12
    
    // Football season typically: Aug-Dec (0-0.5), Jan-May (0.5-1.0)
    if (month >= 8 || month <= 2) {
      return month >= 8 ? (month - 8) / 4 : (month + 4) / 6; // Aug=0, Dec=1, Jan=0.67, Feb=0.83
    } else {
      return 0.5 + (month - 3) / 4; // Mar=0.5, May=1.0
    }
  }

  /**
   * Convert training data to CSV format
   */
  convertToCSV(trainingData: TrainingDataPoint[]): string {
    if (trainingData.length === 0) return '';

    const headers = Object.keys(trainingData[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...trainingData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value?.toString() || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}