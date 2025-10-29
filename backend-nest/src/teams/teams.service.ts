import { BadRequestException, Injectable } from '@nestjs/common';
import { FootballApiService } from '../football-api/football-api.service';
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
  ) {}

  getTeamOverview(teamId: number) {
    return this.footballApi.getTeamInfo(teamId);
  }

  getTeamStats(teamId: number, query: TeamStatsQueryDto) {
    if (!query.leagueId || !query.season) {
      throw new BadRequestException(
        'leagueId and season query parameters are required for team stats',
      );
    }

    return this.footballApi.getTeamStats({
      leagueId: query.leagueId,
      season: query.season,
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
  const name = d?.name || d?.team?.name || d?.team?.fullName || d?.team?.shortName;
  const shortCode = d?.code || d?.team?.shortCode || d?.team?.abbr;

    // Try find existing by externalId
    let existing = await this.teamRepository.findOne({ where: { externalId: externalTeamId } });
    if (!existing) {
      existing = this.teamRepository.create({ externalId: externalTeamId, name: name ?? 'Unknown', shortCode });
    } else {
      existing.name = name ?? existing.name;
      existing.shortCode = shortCode ?? existing.shortCode;
    }

    return this.teamRepository.save(existing);
  }
}
