export interface PredictionResult {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  confidence: 'low' | 'medium' | 'high';
  insights: string[];
  mostLikely: 'home' | 'draw' | 'away';
  createdAt: Date;
}

export interface FormData {
  teamId: number;
  teamName: string;
  matches: {
    date: Date;
    opponent: string;
    result: 'win' | 'draw' | 'loss';
    score: string;
    isHome: boolean;
  }[];
  formRating: number; // 0-100
  points: number;
  maxPoints: number;
}

export interface HeadToHeadStats {
  homeTeamId: number;
  awayTeamId: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  lastFiveMeetings: {
    date: Date;
    homeScore: number;
    awayScore: number;
    result: 'home' | 'draw' | 'away';
  }[];
}

export interface PerformanceStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  winPercentage: number;
}

export interface TeamAnalyticsData {
  teamId: number;
  teamName: string;
  season: string;
  formRating: number;
  homePerformance: PerformanceStats;
  awayPerformance: PerformanceStats;
  overallStats: PerformanceStats;
  scoringTrend: {
    last5Matches: number[];
    average: number;
    trend: 'up' | 'down' | 'stable';
  };
  defensiveRating: number;
  lastUpdated: Date;
}

export interface ComparisonResult {
  homeTeam: TeamAnalyticsData;
  awayTeam: TeamAnalyticsData;
  headToHead: HeadToHeadStats;
  advantage: 'home' | 'away' | 'neutral';
  keyInsights: string[];
}
