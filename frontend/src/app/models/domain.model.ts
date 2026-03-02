/** Core domain interfaces shared across the FootDash frontend. */

// ─── Team ──────────────────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  shortCode?: string;
  logoUrl?: string;
  logo?: string;
  externalId?: number;
  country?: string;
  founded?: number;
}

// ─── Match ─────────────────────────────────────────────────────────────────

export type MatchStatus =
  | 'NS'     // Not started
  | '1H'     // First half in play
  | 'HT'     // Half time
  | '2H'     // Second half in play
  | 'ET'     // Extra time
  | 'P'      // Penalties
  | 'FT'     // Full time (finished)
  | 'FINISHED'
  | 'AET'    // After extra time
  | 'PEN'    // After penalties
  | 'PST'    // Postponed
  | 'CANC'   // Cancelled
  | string;  // catch-all for unmapped statuses

export interface Match {
  id: number;
  externalId?: number | string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  kickOff?: string | null;
  status?: MatchStatus;
  referee?: string | null;
  venue?: string | null;
  season?: string;
  league?: string | null;
}

// ─── Paginated response wrapper ────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Ionic event helpers ───────────────────────────────────────────────────

/** Generic typed CustomEvent for Ionic segment/select change events. */
export interface IonicChangeEvent<T = string> extends CustomEvent {
  detail: { value: T };
}
