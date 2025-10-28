import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamIdParamDto } from './dto/team-id-param.dto';
import { TeamStatsQueryDto } from './dto/team-stats-query.dto';
import { TeamMatchesQueryDto } from './dto/team-matches-query.dto';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':teamId')
  getTeamOverview(@Param() params: TeamIdParamDto) {
    return this.teamsService.getTeamOverview(params.teamId);
  }

  @Get(':teamId/stats')
  getTeamStats(
    @Param() params: TeamIdParamDto,
    @Query() query: TeamStatsQueryDto,
  ) {
    return this.teamsService.getTeamStats(params.teamId, query);
  }

  @Get(':teamId/matches')
  getTeamFixtures(
    @Param() params: TeamIdParamDto,
    @Query() query: TeamMatchesQueryDto,
  ) {
    return this.teamsService.getTeamFixtures(params.teamId, query);
  }

  @Post()
  createTeam(@Body() body: CreateTeamDto) {
    return this.teamsService.createTeam(body);
  }

  @Get(':teamId/db')
  getPersistedTeam(@Param() params: TeamIdParamDto) {
    return this.teamsService.findTeamById(params.teamId);
  }
}
