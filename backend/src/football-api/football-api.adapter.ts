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
  venue?: {
    id?: number;
    name?: string;
    city?: string;
    capacity?: number;
    image?: string;
  } | null;
}

export interface NormalizedFixture {
  // core
  id: number;
  date?: string;
  status?: { short?: string; long?: string } | null;
  home: { id: number; name: string; logo?: string | null };
  away: { id: number; name: string; logo?: string | null };
  goals?: { home?: number | null; away?: number | null } | null;

  // additional metadata
  referee?: string | null;
  venue?: {
    id?: number | null;
    name?: string | null;
    city?: string | null;
    capacity?: number | null;
    image?: string | null;
  } | null;
  league?: {
    id?: number | null;
    name?: string | null;
    country?: string | null;
    logo?: string | null;
    season?: number | null;
  } | null;

  // raw original payload for debugging
  raw?: any;
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
  const mapped = list.map(
    (t) =>
      ({
        id: t.team.id,
        name: t.team.name,
        country: t.team.country,
        founded: t.team.founded,
        logo: t.team.logo,
        venue: t.venue ?? null,
      }) as NormalizedTeam,
  );

  // If single element, return single object to be convenient
  return mapped.length === 1 ? mapped[0] : mapped;
};

export const normalizeFixtures = (
  resp: ApiResponse<FootballFixture[]>,
): NormalizedFixture[] => {
  const list = (resp?.response as FootballFixture[]) || [];
  return list.map((f) => ({
    id:
      f.fixture?.id ??
      (() => {
        throw new Error('fixture id missing');
      })(),
    date: f.fixture?.date,
    status: f.fixture?.status ?? null,
    home: {
      id: f.teams.home.id,
      name: f.teams.home.name,
      logo: f.teams.home.logo ?? null,
    },
    away: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      logo: f.teams.away.logo ?? null,
    },
    goals: f.goals ?? null,

    // referee: may be present under fixture.referee or top-level
    referee: (f.fixture as any)?.referee ?? (f as any)?.referee ?? null,

    // venue: prefer fixture.venue but normalize fields if available
    venue: f.fixture?.venue
      ? {
          id: (f.fixture?.venue as any)?.id ?? null,
          name: f.fixture?.venue?.name ?? null,
          city: f.fixture?.venue?.city ?? null,
          capacity: (f.fixture?.venue as any)?.capacity ?? null,
          image: (f.fixture?.venue as any)?.image ?? null,
        }
      : null,

    // league: enrich if fields exist
    league: f.league
      ? {
          id: f.league.id ?? null,
          name: f.league.name ?? null,
          country: (f.league as any)?.country ?? null,
          logo: (f.league as any)?.logo ?? null,
          season: f.league.season ?? null,
        }
      : null,

    raw: f,
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
