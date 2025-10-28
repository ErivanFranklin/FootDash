import { Injectable } from '@nestjs/common';
import { FootballApiService } from '../football-api/football-api.service';
import { MatchesQueryDto, MatchRangeType } from './dto/matches-query.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly footballApi: FootballApiService) {}

  getTeamMatches(teamId: number, query: MatchesQueryDto) {
    const { range, limit, season } = query;

    const request = {
      teamId,
      season,
      last: range === MatchRangeType.RECENT ? limit ?? 5 : undefined,
      next: range === MatchRangeType.UPCOMING ? limit ?? 5 : undefined,
    };

    return this.footballApi.getTeamFixtures(request);
  }
}
