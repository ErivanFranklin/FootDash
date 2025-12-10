import { Injectable, Logger } from '@nestjs/common';
import { Match } from '../../matches/entities/match.entity';
import { PerformanceStats, HeadToHeadStats } from '../interfaces/analytics.interface';

@Injectable()
export class StatisticalAnalysisService {
  private readonly logger = new Logger(StatisticalAnalysisService.name);

  /**
   * Calculate comprehensive performance statistics
   */
  calculatePerformanceStats(matches: Match[], teamId: number, isHome?: boolean): PerformanceStats {
    let filteredMatches = matches;

    // Filter by home/away if specified
    if (isHome !== undefined) {
      filteredMatches = matches.filter((m) => 
        isHome ? m.homeTeam.id === teamId : m.awayTeam.id === teamId
      );
    }

    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const match of filteredMatches) {
      const isHomeTeam = match.homeTeam.id === teamId;
      const teamScore = isHomeTeam ? match.homeScore : match.awayScore;
      const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;

      if (teamScore == null || opponentScore == null) continue;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (teamScore > opponentScore) won++;
      else if (teamScore === opponentScore) drawn++;
      else lost++;
    }

    const played = won + drawn + lost;
    const points = won * 3 + drawn;
    const winPercentage = played > 0 ? (won / played) * 100 : 0;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      winPercentage: Math.round(winPercentage * 100) / 100,
    };
  }

  /**
   * Calculate defensive rating (goals conceded per match)
   * Lower is better
   */
  calculateDefensiveRating(matches: Match[], teamId: number): number {
    const stats = this.calculatePerformanceStats(matches, teamId);
    if (stats.played === 0) return 0;
    
    return Math.round((stats.goalsAgainst / stats.played) * 100) / 100;
  }

  /**
   * Calculate attacking rating (goals scored per match)
   */
  calculateAttackingRating(matches: Match[], teamId: number): number {
    const stats = this.calculatePerformanceStats(matches, teamId);
    if (stats.played === 0) return 0;
    
    return Math.round((stats.goalsFor / stats.played) * 100) / 100;
  }

  /**
   * Analyze head-to-head history between two teams
   */
  analyzeHeadToHead(matches: Match[], homeTeamId: number, awayTeamId: number): HeadToHeadStats {
    // Filter matches between these two teams
    const h2hMatches = matches.filter(
      (m) =>
        (m.homeTeam.id === homeTeamId && m.awayTeam.id === awayTeamId) ||
        (m.homeTeam.id === awayTeamId && m.awayTeam.id === homeTeamId),
    );

    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    const lastFiveMeetings = [];

    // Sort by most recent first
    const sortedMatches = h2hMatches
      .filter((match) => match.kickOff !== undefined)
      .sort(
        (a, b) =>
          new Date(b.kickOff!).getTime() - new Date(a.kickOff!).getTime(),
      );

    for (const match of sortedMatches.slice(0, 5)) {
      if (match.homeScore == null || match.awayScore == null || match.kickOff == null) continue;

      const isOriginalHome = match.homeTeam.id === homeTeamId;
      const homeScore = isOriginalHome ? match.homeScore : match.awayScore;
      const awayScore = isOriginalHome ? match.awayScore : match.homeScore;

      let result: 'home' | 'draw' | 'away';
      if (homeScore > awayScore) {
        homeWins++;
        result = 'home';
      } else if (homeScore === awayScore) {
        draws++;
        result = 'draw';
      } else {
        awayWins++;
        result = 'away';
      }

      lastFiveMeetings.push({
        date: match.kickOff,
        homeScore,
        awayScore,
        result,
      });
    }

    return {
      homeTeamId,
      awayTeamId,
      homeWins,
      draws,
      awayWins,
      lastFiveMeetings,
    };
  }

  /**
   * Calculate scoring trend over recent matches
   */
  calculateScoringTrend(
    matches: Match[],
    teamId: number,
    lastN = 5,
  ): { last5Matches: number[]; average: number; trend: 'up' | 'down' | 'stable' } {
    const recentMatches = matches.slice(0, lastN);
    const goalsScored: number[] = [];

    for (const match of recentMatches) {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      
      if (teamScore != null) {
        goalsScored.push(teamScore);
      }
    }

    const average = goalsScored.length > 0
      ? goalsScored.reduce((a, b) => a + b, 0) / goalsScored.length
      : 0;

    // Determine trend by comparing first half vs second half
    const trend = this.determineTrend(goalsScored);

    return {
      last5Matches: goalsScored,
      average: Math.round(average * 100) / 100,
      trend,
    };
  }

  /**
   * Determine trend direction
   */
  private determineTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 3) return 'stable';

    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.5) return 'up';
    if (diff < -0.5) return 'down';
    return 'stable';
  }

  /**
   * Calculate home advantage factor (percentage boost for home teams)
   */
  calculateHomeAdvantage(homeMatches: Match[], awayMatches: Match[], teamId: number): number {
    const homeStats = this.calculatePerformanceStats(homeMatches, teamId, true);
    const awayStats = this.calculatePerformanceStats(awayMatches, teamId, false);

    if (homeStats.played === 0 || awayStats.played === 0) return 10; // Default 10% advantage

    const homeWinRate = homeStats.winPercentage;
    const awayWinRate = awayStats.winPercentage;

    return Math.max(0, homeWinRate - awayWinRate);
  }
}
