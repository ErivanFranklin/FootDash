import { Injectable, Logger } from '@nestjs/common';
import { Match } from '../../matches/entities/match.entity';

export interface FormResult {
  matches: {
    id: number;
    date: Date;
    opponent: string;
    result: 'win' | 'draw' | 'loss';
    score: string;
    isHome: boolean;
  }[];
  formRating: number; // 0-100
  points: number;
  maxPoints: number;
  recentForm: string; // e.g., "W-D-L-W-W"
}

@Injectable()
export class FormCalculatorService {
  private readonly logger = new Logger(FormCalculatorService.name);

  /**
   * Calculate form rating for a team based on recent matches
   * @param matches - Recent matches (should be sorted by date desc)
   * @param teamId - ID of the team to calculate form for
   * @param lastN - Number of recent matches to consider (default: 5)
   * @returns Form rating from 0-100
   */
  calculateForm(matches: Match[], teamId: number, lastN = 5): FormResult {
    if (!matches || matches.length === 0) {
      this.logger.warn(`No matches provided for team ${teamId}`);
      return {
        matches: [],
        formRating: 50, // Default neutral rating
        points: 0,
        maxPoints: 0,
        recentForm: '',
      };
    }

    // Take only the last N matches
    const recentMatches = matches.slice(0, lastN);
    let totalPoints = 0;
    const formLetters: string[] = [];
    const matchDetails = [];

    for (const match of recentMatches) {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;

      let result: 'win' | 'draw' | 'loss';
      let points = 0;

      if (teamScore == null || opponentScore == null || match.kickOff == null) {
        // Match not played yet or incomplete data
        continue;
      }

      if (teamScore > opponentScore) {
        result = 'win';
        points = 3;
        formLetters.push('W');
      } else if (teamScore === opponentScore) {
        result = 'draw';
        points = 1;
        formLetters.push('D');
      } else {
        result = 'loss';
        points = 0;
        formLetters.push('L');
      }

      totalPoints += points;
      matchDetails.push({
        id: match.id,
        date: match.kickOff,
        opponent,
        result,
        score: `${teamScore}-${opponentScore}`,
        isHome,
      });
    }

    const playedMatches = matchDetails.length;
    const maxPoints = playedMatches * 3;

    // Calculate rating: (points earned / max possible points) * 100
    const formRating = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 50;

    return {
      matches: matchDetails,
      formRating: Math.round(formRating * 100) / 100, // Round to 2 decimal places
      points: totalPoints,
      maxPoints,
      recentForm: formLetters.join('-'),
    };
  }

  /**
   * Calculate home-specific form rating
   */
  calculateHomeForm(matches: Match[], teamId: number, lastN = 5): FormResult {
    const homeMatches = matches.filter((m) => m.homeTeam.id === teamId);
    return this.calculateForm(homeMatches, teamId, lastN);
  }

  /**
   * Calculate away-specific form rating
   */
  calculateAwayForm(matches: Match[], teamId: number, lastN = 5): FormResult {
    const awayMatches = matches.filter((m) => m.awayTeam.id === teamId);
    return this.calculateForm(awayMatches, teamId, lastN);
  }

  /**
   * Determine form trend based on recent matches
   */
  determineFormTrend(formRatings: number[]): 'up' | 'down' | 'stable' {
    if (formRatings.length < 2) return 'stable';

    // Calculate simple moving average of first half vs second half
    const mid = Math.floor(formRatings.length / 2);
    const firstHalf = formRatings.slice(0, mid);
    const secondHalf = formRatings.slice(mid);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 10) return 'up';
    if (diff < -10) return 'down';
    return 'stable';
  }

  /**
   * Get confidence level based on data availability and consistency
   */
  getConfidenceLevel(
    matchCount: number,
    formVariance: number,
  ): 'low' | 'medium' | 'high' {
    if (matchCount < 3) return 'low';
    if (matchCount < 5) return 'medium';
    
    // High variance in form (inconsistent results) = lower confidence
    if (formVariance > 30) return 'medium';
    
    return 'high';
  }
}
