import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesQueryDto } from './dto/matches-query.dto';
import { TeamIdParamDto } from '../teams/dto/team-id-param.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('team/:teamId')
  getMatchesForTeam(
    @Param() params: TeamIdParamDto,
    @Query() query: MatchesQueryDto,
  ) {
    return this.matchesService.getTeamMatches(params.teamId, query);
  }
}
