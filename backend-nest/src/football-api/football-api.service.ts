import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ApiResponse, FootballFixture, FootballTeamInfo, FootballTeamStats } from './football-api.interface';

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
    return this.makeRequest<ApiResponse<FootballTeamInfo[]>>('teams', {
      team: teamId,
    });
  }

  async getTeamStats(params: TeamStatsParams) {
    return this.makeRequest<ApiResponse<FootballTeamStats>>('teams/statistics', {
      league: params.leagueId,
      season: params.season,
      team: params.teamId,
    });
  }

  async getTeamFixtures(params: TeamFixturesParams) {
    const query: Record<string, number | string> = {
      team: params.teamId,
    };
    if (params.season) query.season = params.season;
    if (params.last) query.last = params.last;
    if (params.next) query.next = params.next;
    if (params.status) query.status = params.status;
    return this.makeRequest<ApiResponse<FootballFixture[]>>('fixtures', query);
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
