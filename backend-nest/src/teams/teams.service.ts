import { BadRequestException, Injectable } from '@nestjs/common';
import { FootballApiService } from '../football-api/football-api.service';
import { TeamMatchesQueryDto } from './dto/team-matches-query.dto';
import { TeamStatsQueryDto } from './dto/team-stats-query.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly footballApi: FootballApiService) {}

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
}
