// Analytics Data Models for FootDash

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
  metadata?: {
    homeFormRating?: number;
    awayFormRating?: number;
    headToHeadWins?: { home: number; away: number; draws: number };
    dataQuality?: string;
  };
}

export interface TeamForm {
  teamId: number;
  teamName: string;
  formRating: number; // 0-100
  recentForm: string; // e.g., "WDLWW"
  matches: MatchResult[];
  lastUpdated: Date;
}

export interface MatchResult {
  id: number;
  date: Date;
  opponent: string;
  result: 'win' | 'draw' | 'loss';
  score: string;
  isHome: boolean;
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

export interface TeamAnalytics {
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

export interface TeamComparison {
  homeTeam: TeamAnalytics;
  awayTeam: TeamAnalytics;
  headToHead: HeadToHeadStats;
  advantage: 'home' | 'away' | 'neutral';
  keyInsights: string[];
}

export interface HeadToHeadStats {
  homeTeamId: number;
  awayTeamId: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  totalMeetings: number;
  lastFiveMeetings: {
    date: Date;
    homeScore: number;
    awayScore: number;
    result: 'home' | 'draw' | 'away';
  }[];
}

// Chart.js data structures
export interface ProbabilityChartData {
  labels: string[];
  datasets: [{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }];
}

export interface FormChartData {
  labels: string[];
  datasets: [{
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }];
}

export interface ComparisonChartData {
  labels: string[];
  datasets: [{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }];
}
