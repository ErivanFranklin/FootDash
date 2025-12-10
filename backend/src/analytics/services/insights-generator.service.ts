import { Injectable } from '@nestjs/common';
import { FormResult } from './form-calculator.service';
import { HeadToHeadStats, PerformanceStats } from '../interfaces/analytics.interface';

@Injectable()
export class InsightsGeneratorService {
  /**
   * Generate natural language insights for a match prediction
   */
  generateMatchInsights(params: {
    homeForm: FormResult;
    awayForm: FormResult;
    homeStats: PerformanceStats;
    awayStats: PerformanceStats;
    h2h: HeadToHeadStats;
    homeTeamName: string;
    awayTeamName: string;
  }): string[] {
    const insights: string[] = [];
    const { homeForm, awayForm, homeStats, awayStats, h2h, homeTeamName, awayTeamName } = params;

    // Form-based insights
    if (homeForm.formRating > 70) {
      insights.push(`${homeTeamName} are in excellent form with ${homeForm.recentForm}`);
    } else if (homeForm.formRating < 30) {
      insights.push(`${homeTeamName} are struggling with recent form (${homeForm.recentForm})`);
    }

    if (awayForm.formRating > 70) {
      insights.push(`${awayTeamName} are in excellent form with ${awayForm.recentForm}`);
    } else if (awayForm.formRating < 30) {
      insights.push(`${awayTeamName} are struggling with recent form (${awayForm.recentForm})`);
    }

    // Head-to-head insights
    const totalH2H = h2h.homeWins + h2h.draws + h2h.awayWins;
    if (totalH2H > 0) {
      if (h2h.homeWins > h2h.awayWins + 2) {
        insights.push(
          `${homeTeamName} have dominated recent meetings (${h2h.homeWins} wins in last ${totalH2H} matches)`,
        );
      } else if (h2h.awayWins > h2h.homeWins + 2) {
        insights.push(
          `${awayTeamName} have the upper hand historically (${h2h.awayWins} wins in last ${totalH2H} matches)`,
        );
      } else if (h2h.draws >= totalH2H / 2) {
        insights.push(`Recent meetings have been closely contested with ${h2h.draws} draws`);
      }
    }

    // Scoring insights
    const homeGoalsPerGame = homeStats.played > 0 ? homeStats.goalsFor / homeStats.played : 0;
    const awayGoalsPerGame = awayStats.played > 0 ? awayStats.goalsFor / awayStats.played : 0;

    if (homeGoalsPerGame > 2.5) {
      insights.push(
        `${homeTeamName} are prolific scorers averaging ${homeGoalsPerGame.toFixed(1)} goals per game`,
      );
    }

    if (awayGoalsPerGame > 2.5) {
      insights.push(
        `${awayTeamName} are prolific scorers averaging ${awayGoalsPerGame.toFixed(1)} goals per game`,
      );
    }

    // Defensive insights
    const homeDefense = homeStats.played > 0 ? homeStats.goalsAgainst / homeStats.played : 0;
    const awayDefense = awayStats.played > 0 ? awayStats.goalsAgainst / awayStats.played : 0;

    if (homeDefense < 0.8) {
      insights.push(`${homeTeamName} have a strong defense conceding only ${homeDefense.toFixed(1)} goals per game`);
    } else if (homeDefense > 2) {
      insights.push(`${homeTeamName} have defensive concerns conceding ${homeDefense.toFixed(1)} goals per game`);
    }

    if (awayDefense < 0.8) {
      insights.push(`${awayTeamName} have a solid defense conceding only ${awayDefense.toFixed(1)} goals per game`);
    } else if (awayDefense > 2) {
      insights.push(`${awayTeamName} have been leaking goals (${awayDefense.toFixed(1)} per game)`);
    }

    // Win streak insights
    if (homeForm.recentForm.startsWith('W-W-W')) {
      insights.push(`${homeTeamName} are on a winning streak`);
    }

    if (awayForm.recentForm.startsWith('W-W-W')) {
      insights.push(`${awayTeamName} are on a winning streak`);
    }

    // Limit to most relevant insights
    return insights.slice(0, 5);
  }

  /**
   * Generate insights for team analytics
   */
  generateTeamInsights(params: {
    teamName: string;
    formRating: number;
    homeStats: PerformanceStats;
    awayStats: PerformanceStats;
    overallStats: PerformanceStats;
    scoringTrend: { trend: 'up' | 'down' | 'stable'; average: number };
  }): string[] {
    const insights: string[] = [];
    const { teamName, formRating, homeStats, awayStats, overallStats, scoringTrend } = params;

    // Overall form
    if (formRating > 70) {
      insights.push(`${teamName} are in excellent form`);
    } else if (formRating < 30) {
      insights.push(`${teamName} are struggling for form`);
    }

    // Home vs Away performance
    if (homeStats.winPercentage > awayStats.winPercentage + 20) {
      insights.push(`Much stronger at home (${homeStats.winPercentage.toFixed(0)}% vs ${awayStats.winPercentage.toFixed(0)}% away)`);
    } else if (awayStats.winPercentage > homeStats.winPercentage + 20) {
      insights.push(`Surprisingly better away from home`);
    }

    // Scoring trend
    if (scoringTrend.trend === 'up') {
      insights.push(`Goals scoring is trending upward (${scoringTrend.average.toFixed(1)} per game)`);
    } else if (scoringTrend.trend === 'down') {
      insights.push(`Struggling to find the net recently (${scoringTrend.average.toFixed(1)} per game)`);
    }

    // Goal difference
    if (overallStats.goalDifference > 20) {
      insights.push(`Exceptional goal difference of +${overallStats.goalDifference}`);
    } else if (overallStats.goalDifference < -20) {
      insights.push(`Poor goal difference of ${overallStats.goalDifference}`);
    }

    // Win percentage
    if (overallStats.winPercentage > 60) {
      insights.push(`Impressive ${overallStats.winPercentage.toFixed(0)}% win rate this season`);
    } else if (overallStats.winPercentage < 30) {
      insights.push(`Struggling with only ${overallStats.winPercentage.toFixed(0)}% win rate`);
    }

    return insights.slice(0, 5);
  }

  /**
   * Determine prediction confidence based on data quality
   */
  determineConfidence(params: {
    homeMatchCount: number;
    awayMatchCount: number;
    h2hCount: number;
    formConsistency: number;
  }): 'low' | 'medium' | 'high' {
    const { homeMatchCount, awayMatchCount, h2hCount, formConsistency } = params;

    // Low confidence if insufficient data
    if (homeMatchCount < 3 || awayMatchCount < 3) {
      return 'low';
    }

    // High confidence if plenty of data and consistent form
    if (
      homeMatchCount >= 10 &&
      awayMatchCount >= 10 &&
      h2hCount >= 3 &&
      formConsistency > 70
    ) {
      return 'high';
    }

    // Medium confidence otherwise
    return 'medium';
  }
}
