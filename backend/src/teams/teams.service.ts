import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { FootballApiService } from '../football-api/football-api.service';
import { ConfigService } from '@nestjs/config';
import { TeamMatchesQueryDto } from './dto/team-matches-query.dto';
import { TeamStatsQueryDto } from './dto/team-stats-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly footballApi: FootballApiService,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @Optional() private readonly config?: ConfigService,
  ) {}

  getTeamOverview(teamId: number) {
    return this.footballApi.getTeamInfo(teamId);
  }

  getTeamStats(teamId: number, query: TeamStatsQueryDto) {
    // Read default league from config (env vars may be strings or numbers)
    const defaultLeagueRaw = this.config?.get<string | number>(
      'FOOTBALL_API_DEFAULT_LEAGUE',
    );
    const defaultLeague =
      typeof defaultLeagueRaw === 'string'
        ? Number(defaultLeagueRaw) || undefined
        : (defaultLeagueRaw as number | undefined);

    const leagueId = query.leagueId ?? defaultLeague;

    // If still no leagueId or missing season, allow call only when running in mock mode; otherwise reject
    // Prefer using the FootballApiService public API when available.
    const isMock =
      typeof (this.footballApi as any).isMockMode === 'function'
        ? (this.footballApi as any).isMockMode()
        : false;

    if ((!leagueId && !isMock) || !query.season) {
      // Require both leagueId and season in non-mock mode
      if (!isMock) {
        throw new BadRequestException(
          'leagueId and season query parameters are required for team stats',
        );
      }
    }

    // Final numeric league to send to the Football API. If not provided, and mock mode
    // is enabled, fall back to 999 (a harmless dummy id) so mock responses work.
    const finalLeague = Number(leagueId ?? 999);

    return this.footballApi.getTeamStats({
      leagueId: finalLeague,
      season: query.season as number,
      teamId,
    });
  }

  getTeamFixtures(teamId: number, query: TeamMatchesQueryDto) {
    const { season, last, next, status } = query;
    return this.footballApi.getTeamFixtures({
      teamId,
      season,
      last,
      next,
      status,
    });
  }

  // Persistence helpers
  async createTeam(dto: CreateTeamDto) {
    const t = this.teamRepository.create(dto as Partial<Team>);
    return this.teamRepository.save(t);
  }

  async findTeamById(id: number) {
    return this.teamRepository.findOne({ where: { id } });
  }

  /**
   * Fetch team info from Football API and upsert into DB.
   * Returns the saved Team entity.
   */
  async syncTeamFromApi(externalTeamId: number) {
    const apiData = await this.footballApi.getTeamInfo(externalTeamId);

    // apiData shape may vary; try to read common fields
    const d: any = apiData as any;
    const name =
      d?.name || d?.team?.name || d?.team?.fullName || d?.team?.shortName;
    const shortCode = d?.code || d?.team?.shortCode || d?.team?.abbr;

    // Try find existing by externalId
    let existing = await this.teamRepository.findOne({
      where: { externalId: externalTeamId },
    });
    if (!existing) {
      existing = this.teamRepository.create({
        externalId: externalTeamId,
        name: name ?? 'Unknown',
        shortCode,
      });
    } else {
      existing.name = name ?? existing.name;
      existing.shortCode = shortCode ?? existing.shortCode;
    }

    return this.teamRepository.save(existing);
  }
}
