export interface NormalizedMatch {
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string | null;
  kickOff?: string | Date | null;
  venueName?: string | null;
  referee?: string | null;
  leagueName?: string | null;
  leagueLogo?: string | null;
  raw?: any;
}

export function normalizeMatch(raw: any): NormalizedMatch {
  const homeName = raw?.homeTeam?.name || raw?.home?.name || raw?.homeName || raw?.teams?.home?.name || 'Home';
  const awayName = raw?.awayTeam?.name || raw?.away?.name || raw?.awayName || raw?.teams?.away?.name || 'Away';

  // Try common logo fields used by adapters
  const homeLogo = raw?.homeTeam?.logo || raw?.home?.logo || raw?.home?.logoUrl || raw?.teams?.home?.logo || null;
  const awayLogo = raw?.awayTeam?.logo || raw?.away?.logo || raw?.away?.logoUrl || raw?.teams?.away?.logo || null;

  const homeScore = (raw?.homeScore ?? raw?.score?.home ?? raw?.goals?.home) ?? null;
  const awayScore = (raw?.awayScore ?? raw?.score?.away ?? raw?.goals?.away) ?? null;

  const status = raw?.status || raw?.fixture?.status || null;

  const kickOff = raw?.kickOff || raw?.kickoff || raw?.fixture?.date || raw?.utcDate || null;

  const venueName = raw?.venue?.name || raw?.venue || (raw?.fixture?.venue?.name) || null;

  const referee = raw?.referee || null;

  const leagueName = raw?.league?.name || raw?.competition?.name || null;
  const leagueLogo = raw?.league?.logo || raw?.competition?.logo || null;

  return {
    homeName,
    awayName,
    homeLogo,
    awayLogo,
    homeScore,
    awayScore,
    status,
    kickOff,
    venueName,
    referee,
    leagueName,
    leagueLogo,
    raw,
  };
}
