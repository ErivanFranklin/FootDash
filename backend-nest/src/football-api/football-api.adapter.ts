import {
  ApiResponse,
  FootballFixture,
  FootballTeamInfo,
  FootballTeamStats,
} from './football-api.interface';

export interface NormalizedTeam {
  id: number;
  name: string;
  country?: string;
  founded?: number;
  logo?: string;
  venue?: { id?: number; name?: string; city?: string; capacity?: number; image?: string } | null;
}

export interface NormalizedFixture {
  id: number;
  date?: string;
  venue?: { name?: string; city?: string } | null;
  status?: { short?: string; long?: string } | null;
  league?: { id: number; name: string; season?: number } | null;
  home: { id: number; name: string; logo?: string | null };
  away: { id: number; name: string; logo?: string | null };
  goals?: { home?: number | null; away?: number | null } | null;
}

export interface NormalizedTeamStats {
  fixtures: Record<string, unknown>;
  goals: Record<string, unknown>;
  biggest?: Record<string, unknown>;
  lineups?: Array<Record<string, unknown>>;
}

export const normalizeTeamInfo = (
  resp: ApiResponse<FootballTeamInfo[]>,
): NormalizedTeam | NormalizedTeam[] => {
  const list = (resp?.response as FootballTeamInfo[]) || [];
  const mapped = list.map((t) => ({
    id: t.team.id,
    name: t.team.name,
    country: t.team.country,
    founded: t.team.founded,
    logo: t.team.logo,
    venue: t.venue ?? null,
  } as NormalizedTeam));

  // If single element, return single object to be convenient
  return mapped.length === 1 ? mapped[0] : mapped;
};

export const normalizeFixtures = (
  resp: ApiResponse<FootballFixture[]>,
): NormalizedFixture[] => {
  const list = (resp?.response as FootballFixture[]) || [];
  return list.map((f) => ({
    id: f.fixture?.id ?? (() => { throw new Error('fixture id missing'); })(),
    date: f.fixture?.date,
    venue: f.fixture?.venue ?? null,
    status: f.fixture?.status ?? null,
    league: f.league ? { id: f.league.id, name: f.league.name, season: f.league.season } : null,
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo ?? null },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo ?? null },
    goals: f.goals ?? null,
  }));
};

export const normalizeTeamStats = (
  resp: ApiResponse<FootballTeamStats>,
): NormalizedTeamStats => {
  const r = resp?.response as FootballTeamStats;
  return {
    fixtures: r?.fixtures ?? {},
    goals: r?.goals ?? {},
    biggest: r?.biggest ?? {},
    lineups: r?.lineups ?? [],
  };
};
