import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  ApiResponse,
  FootballFixture,
  FootballTeamInfo,
  FootballTeamStats,
} from './football-api.interface';
import { FootballApiAdapter } from './football-api-adapter.interface';
import {
  normalizeTeamInfo,
  normalizeFixtures,
  normalizeTeamStats,
} from './football-api.adapter';
import { FootballApiCacheService } from './football-api-cache.service';

interface TeamStatsParams {
  leagueId: number;
  season: number;
  teamId: number;
}

interface TeamFixturesParams {
  teamId: number;
  season?: number;
  last?: number;
  next?: number;
  status?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

@Injectable()
export class FootballApiService implements FootballApiAdapter {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly isConfigured: boolean;
  private readonly mock: boolean;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly cache: FootballApiCacheService,
  ) {
    const apiKey = this.config.get<string>('FOOTBALL_API_KEY');
    const apiUrl = this.config.get<string>('FOOTBALL_API_URL');
    this.isConfigured = Boolean(apiKey && apiUrl);
    this.mock = this.config.get<boolean>('FOOTBALL_API_MOCK', false);
  }

  /**
   * Public accessor to check whether the service is running in mock mode.
   * Useful so other services do not need to reach into private fields.
   */
  public isMockMode(): boolean {
    return this.mock === true;
  }

  async getTeamInfo(teamId: number) {
    if (this.mock) {
      return {
        id: teamId,
        name: `Mock Team ${teamId}`,
        country: 'Mockland',
        founded: 1900,
        logo: null,
        venue: {
          id: 1,
          name: 'Mock Arena',
          city: 'Mock City',
          capacity: 40000,
          image: null,
        },
      };
    }

    const cacheKey = this.cache.buildKey('team-info', { teamId });
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const resp = await this.makeRequest<ApiResponse<FootballTeamInfo[]>>(
      'teams',
      {
        team: teamId,
      },
    );
    const result = normalizeTeamInfo(resp as ApiResponse<FootballTeamInfo[]>);
    await this.cache.set(cacheKey, result, FootballApiCacheService.TTL.TEAM_INFO);
    return result;
  }

  async getTeamStats(params: TeamStatsParams) {
    if (this.mock) {
      return {
        fixtures: {
          played: { total: 20 },
          wins: { total: 12 },
          draws: { total: 5 },
          loses: { total: 3 },
        },
        goals: { for: { total: 36 }, against: { total: 18 } },
        biggest: {},
        lineups: [],
      } as any;
    }
    const cacheKey = this.cache.buildKey('team-stats', params as unknown as Record<string, unknown>);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const resp = await this.makeRequest<ApiResponse<FootballTeamStats>>(
      'teams/statistics',
      {
        league: params.leagueId,
        season: params.season,
        team: params.teamId,
      },
    );
    const result = normalizeTeamStats(resp as ApiResponse<FootballTeamStats>);
    await this.cache.set(cacheKey, result, FootballApiCacheService.TTL.TEAM_STATS);
    return result;
  }

  async getTeamFixtures(params: TeamFixturesParams) {
    if (this.mock) {
      return [
        {
          id: 1001,
          date: new Date().toISOString(),
          status: { short: 'FT', long: 'Full Time' },
          home: {
            id: params.teamId,
            name: `Mock Team ${params.teamId}`,
            logo: null,
          },
          away: { id: 44, name: 'Mock Rivals', logo: null },
          goals: { home: 2, away: 1 },
          referee: null,
          venue: {
            id: 1,
            name: 'Mock Arena',
            city: 'Mock City',
            capacity: 40000,
            image: null,
          },
          league: {
            id: 999,
            name: 'Mock League',
            country: 'Mockland',
            logo: null,
            season: params.season ?? 2025,
          },
          raw: {},
        },
      ];
    }
    const query: Record<string, number | string> = {
      team: params.teamId,
    };
    if (params.season) query.season = params.season;
    if (params.last) query.last = params.last;
    if (params.next) query.next = params.next;
    if (params.status) query.status = params.status;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;

    // Determine cache TTL based on request type
    const fixtureTtl = params.next
      ? FootballApiCacheService.TTL.FIXTURES_UPCOMING
      : params.last
        ? FootballApiCacheService.TTL.FIXTURES_RECENT
        : FootballApiCacheService.TTL.FIXTURES_ALL;
    const cacheKey = this.cache.buildKey('fixtures', query);
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    let resp = await this.makeRequest<ApiResponse<FootballFixture[]>>(
      'fixtures',
      query,
    );

    // Free plan does not support "last" / "next" params – retry without them
    const raw = resp as any;
    const hasPlanError =
      raw?.errors &&
      typeof raw.errors === 'object' &&
      'plan' in raw.errors;
    if (hasPlanError && (params.last || params.next)) {
      this.logger.warn(
        'Free plan limitation detected – retrying without last/next params',
      );
      delete query.last;
      delete query.next;
      resp = await this.makeRequest<ApiResponse<FootballFixture[]>>(
        'fixtures',
        query,
      );
    }

    const result = normalizeFixtures(resp as ApiResponse<FootballFixture[]>);
    await this.cache.set(cacheKey, result, fixtureTtl);
    return result;
  }

  async getMatch(matchId: number) {
    if (this.mock) {
      return {
        id: matchId,
        date: new Date().toISOString(),
        status: 'IN_PLAY',
        minute: 45,
        home: {
          id: 100,
          name: 'Mock Home Team',
          logo: null,
        },
        away: {
          id: 101,
          name: 'Mock Away Team',
          logo: null,
        },
        score: {
          fullTime: { home: 1, away: 1 },
          halfTime: { home: 1, away: 0 },
        },
        referee: null,
        venue: {
          id: 1,
          name: 'Mock Stadium',
          city: 'Mock City',
          capacity: 50000,
          image: null,
        },
        league: {
          id: 999,
          name: 'Mock League',
          country: 'Mockland',
          logo: null,
          season: 2025,
        },
        raw: {},
      };
    }

    const cacheKey = this.cache.buildKey('match', { matchId });
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const resp = await this.makeRequest<ApiResponse<FootballFixture[]>>(
      'fixtures',
      {
        id: matchId,
      },
    );

    // The API returns an array even for single fixture
    const fixtures = normalizeFixtures(resp as ApiResponse<FootballFixture[]>);
    const result = fixtures && fixtures.length > 0 ? fixtures[0] : null;

    // Cache based on match status
    if (result) {
      const status = (result as any)?.status?.short ?? '';
      const ttl = ['FT', 'AET', 'PEN'].includes(status)
        ? FootballApiCacheService.TTL.MATCH_FINISHED
        : FootballApiCacheService.TTL.MATCH_LIVE;
      await this.cache.set(cacheKey, result, ttl);
    }
    return result;
  }

  async getFixtureLineups(fixtureId: number) {
    if (this.mock) {
      return this.getMockLineups(fixtureId);
    }

    const cacheKey = this.cache.buildKey('lineups', { fixtureId });
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const resp = await this.makeRequest<any>('fixtures/lineups', {
        fixture: fixtureId,
      });

      const data = resp?.response ?? [];
      const result = data.map((teamLineup: any) => ({
        team: {
          id: teamLineup.team?.id,
          name: teamLineup.team?.name,
          logo: teamLineup.team?.logo,
        },
        formation: teamLineup.formation,
        startXI: (teamLineup.startXI ?? []).map((entry: any) => ({
          id: entry.player?.id,
          name: entry.player?.name,
          number: entry.player?.number,
          pos: entry.player?.pos,
          grid: entry.player?.grid,
        })),
        substitutes: (teamLineup.substitutes ?? []).map((entry: any) => ({
          id: entry.player?.id,
          name: entry.player?.name,
          number: entry.player?.number,
          pos: entry.player?.pos,
        })),
        coach: {
          id: teamLineup.coach?.id,
          name: teamLineup.coach?.name,
          photo: teamLineup.coach?.photo,
        },
      }));

      await this.cache.set(cacheKey, result, FootballApiCacheService.TTL.MATCH_FINISHED);
      return result;
    } catch (error) {
      this.logger.warn(`Failed to fetch lineups for fixture ${fixtureId}: ${(error as Error).message}`);
      return [];
    }
  }

  private getMockLineups(fixtureId: number) {
    const mockPlayers = (teamName: string, formation: string) => {
      const positions = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'F', 'F', 'F'];
      return {
        team: { id: fixtureId * 10, name: teamName, logo: null },
        formation,
        startXI: positions.map((pos, i) => ({
          id: fixtureId * 100 + i,
          name: `${teamName} Player ${i + 1}`,
          number: i + 1,
          pos,
          grid: `${Math.floor(i / 4) + 1}:${(i % 4) + 1}`,
        })),
        substitutes: Array.from({ length: 7 }, (_, i) => ({
          id: fixtureId * 100 + 11 + i,
          name: `${teamName} Sub ${i + 1}`,
          number: 12 + i,
          pos: ['D', 'M', 'F', 'M', 'D', 'F', 'G'][i],
        })),
        coach: {
          id: fixtureId * 10 + 1,
          name: `Coach ${teamName}`,
          photo: null,
        },
      };
    };
    return [
      mockPlayers('Mock Home', '4-3-3'),
      mockPlayers('Mock Away', '4-4-2'),
    ];
  }

  // ── League endpoints (Phase 13.3) ──────────────────────────────────────────

  /**
   * Get available leagues / competitions.
   */
  async getLeagues(country?: string): Promise<any[]> {
    if (this.mock) return this.getMockLeagues(country);

    const cacheKey = `leagues:${country ?? 'all'}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const params: Record<string, string | number> = {};
      if (country) params.country = country;
      const data = await this.makeRequest<ApiResponse<any>>('leagues', params);
      const leagues = (data as any).response ?? [];
      await this.cache.set(cacheKey, leagues, 86400); // 24h
      return leagues;
    } catch (error) {
      this.logger.warn(`Failed to fetch leagues: ${(error as Error).message}`);
      return this.getMockLeagues(country);
    }
  }

  /**
   * Get standings for a specific league and season.
   */
  async getLeagueStandings(leagueId: number, season: number): Promise<any[]> {
    if (this.mock) return this.getMockStandings(leagueId);

    const cacheKey = `standings:${leagueId}:${season}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.makeRequest<ApiResponse<any>>('standings', { league: leagueId, season });
      const standings = (data as any).response?.[0]?.league?.standings?.[0] ?? [];
      await this.cache.set(cacheKey, standings, 3600); // 1h
      return standings;
    } catch (error) {
      this.logger.warn(`Failed to fetch standings for league ${leagueId}: ${(error as Error).message}`);
      return this.getMockStandings(leagueId);
    }
  }

  /**
   * Get fixtures for a specific league, season and optionally a round.
   */
  async getLeagueFixtures(leagueId: number, season: number, round?: string): Promise<any[]> {
    if (this.mock) return this.getMockLeagueFixtures(leagueId);

    const cacheKey = `league_fixtures:${leagueId}:${season}:${round ?? 'all'}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const params: Record<string, string | number> = { league: leagueId, season };
      if (round) params.round = round;
      const data = await this.makeRequest<ApiResponse<any>>('fixtures', params);
      const fixtures = (data as any).response ?? [];
      await this.cache.set(cacheKey, fixtures, 1800); // 30m
      return fixtures;
    } catch (error) {
      this.logger.warn(`Failed to fetch league fixtures: ${(error as Error).message}`);
      return this.getMockLeagueFixtures(leagueId);
    }
  }

  private getMockLeagues(_country?: string): any[] {
    return [
      { league: { id: 39, name: 'Premier League', type: 'League', logo: null }, country: { name: 'England', code: 'GB', flag: null } },
      { league: { id: 140, name: 'La Liga', type: 'League', logo: null }, country: { name: 'Spain', code: 'ES', flag: null } },
      { league: { id: 135, name: 'Serie A', type: 'League', logo: null }, country: { name: 'Italy', code: 'IT', flag: null } },
      { league: { id: 78, name: 'Bundesliga', type: 'League', logo: null }, country: { name: 'Germany', code: 'DE', flag: null } },
      { league: { id: 61, name: 'Ligue 1', type: 'League', logo: null }, country: { name: 'France', code: 'FR', flag: null } },
      { league: { id: 2, name: 'Champions League', type: 'Cup', logo: null }, country: { name: 'World', code: null, flag: null } },
      { league: { id: 3, name: 'Europa League', type: 'Cup', logo: null }, country: { name: 'World', code: null, flag: null } },
    ];
  }

  private getMockStandings(leagueId: number): any[] {
    const teams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
    return teams.map((name, idx) => ({
      rank: idx + 1,
      team: { id: leagueId * 100 + idx, name, logo: null },
      points: 30 - idx * 3,
      goalsDiff: 15 - idx * 4,
      all: { played: 15, win: 10 - idx, draw: idx, lose: 5 - (4 - idx), goals: { for: 25 - idx * 2, against: 10 + idx * 2 } },
    }));
  }

  private getMockLeagueFixtures(leagueId: number): any[] {
    return Array.from({ length: 5 }, (_, i) => ({
      fixture: { id: leagueId * 1000 + i, date: new Date().toISOString(), status: { short: 'NS' } },
      teams: { home: { id: leagueId * 10 + i, name: `Home ${i + 1}` }, away: { id: leagueId * 10 + i + 5, name: `Away ${i + 1}` } },
      goals: { home: null, away: null },
    }));
  }

  private async makeRequest<T>(
    path: string,
    params?: Record<string, number | string>,
  ) {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Football API credentials are not configured',
      );
    }

    try {
      const response = await firstValueFrom<AxiosResponse<T>>(
        this.http.get<T>(path, { params }),
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      this.logger.error(
        `Football API request failed: ${err.message}`,
        err.stack,
      );
      throw new ServiceUnavailableException('Failed to reach Football API');
    }
  }
}
