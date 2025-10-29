import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ApiResponse, FootballFixture, FootballTeamInfo, FootballTeamStats } from './football-api.interface';
import { normalizeTeamInfo, normalizeFixtures, normalizeTeamStats } from './football-api.adapter';

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
}

@Injectable()
export class FootballApiService {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly isConfigured: boolean;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('FOOTBALL_API_KEY');
    const apiUrl = this.config.get<string>('FOOTBALL_API_URL');
    this.isConfigured = Boolean(apiKey && apiUrl);
  }

  async getTeamInfo(teamId: number) {
    const resp = await this.makeRequest<ApiResponse<FootballTeamInfo[]>>('teams', {
      team: teamId,
    });
    return normalizeTeamInfo(resp as ApiResponse<FootballTeamInfo[]>);
  }

  async getTeamStats(params: TeamStatsParams) {
    const resp = await this.makeRequest<ApiResponse<FootballTeamStats>>('teams/statistics', {
      league: params.leagueId,
      season: params.season,
      team: params.teamId,
    });
    return normalizeTeamStats(resp as ApiResponse<FootballTeamStats>);
  }

  async getTeamFixtures(params: TeamFixturesParams) {
    const query: Record<string, number | string> = {
      team: params.teamId,
    };
    if (params.season) query.season = params.season;
    if (params.last) query.last = params.last;
    if (params.next) query.next = params.next;
    if (params.status) query.status = params.status;
    const resp = await this.makeRequest<ApiResponse<FootballFixture[]>>('fixtures', query);
    return normalizeFixtures(resp as ApiResponse<FootballFixture[]>);
  }

  private async makeRequest<T>(path: string, params?: Record<string, number | string>) {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Football API credentials are not configured');
    }

    try {
      const response = await firstValueFrom<AxiosResponse<T>>(
        this.http.get<T>(path, { params }),
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      this.logger.error(`Football API request failed: ${err.message}`, err.stack);
      throw new ServiceUnavailableException('Failed to reach Football API');
    }
  }
}
