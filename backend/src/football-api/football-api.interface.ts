export interface ApiResponse<T> {
  results: number;
  response: T;
}

export interface FootballTeamInfo {
  team: {
    id: number;
    name: string;
    country?: string;
    founded?: number;
    logo?: string;
  };
  venue?: {
    id?: number;
    name?: string;
    city?: string;
    capacity?: number;
    image?: string;
  };
}

export interface FootballFixture {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string; city?: string };
    status?: { short?: string; long?: string };
  };
  league?: {
    id: number;
    name: string;
    country?: string;
    season?: number;
    logo?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string; winner?: boolean | null };
    away: { id: number; name: string; logo?: string; winner?: boolean | null };
  };
  goals?: {
    home: number | null;
    away: number | null;
  };
}

export interface FootballTeamStats {
  fixtures: Record<string, unknown>;
  goals: Record<string, unknown>;
  biggest?: Record<string, unknown>;
  lineups?: Array<Record<string, unknown>>;
}
