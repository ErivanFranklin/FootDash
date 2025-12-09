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
    const resp = await this.makeRequest<ApiResponse<FootballTeamInfo[]>>(
      'teams',
      {
        team: teamId,
      },
    );
    return normalizeTeamInfo(resp as ApiResponse<FootballTeamInfo[]>);
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
    const resp = await this.makeRequest<ApiResponse<FootballTeamStats>>(
      'teams/statistics',
      {
        league: params.leagueId,
        season: params.season,
        team: params.teamId,
      },
    );
    return normalizeTeamStats(resp as ApiResponse<FootballTeamStats>);
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
    const resp = await this.makeRequest<ApiResponse<FootballFixture[]>>(
      'fixtures',
      query,
    );
    return normalizeFixtures(resp as ApiResponse<FootballFixture[]>);
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

    const resp = await this.makeRequest<ApiResponse<FootballFixture>>(
      'fixtures',
      {
        id: matchId,
      },
    );

    // The API returns an array even for single fixture
    const data = resp as ApiResponse<FootballFixture[]>;
    const fixtures = normalizeFixtures(data);
    return fixtures && fixtures.length > 0 ? fixtures[0] : null;
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
