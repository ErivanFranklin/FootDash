import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamIdParamDto } from './dto/team-id-param.dto';
import { TeamStatsQueryDto } from './dto/team-stats-query.dto';
import { TeamMatchesQueryDto } from './dto/team-matches-query.dto';
import { CreateTeamDto } from './dto/create-team.dto';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams from database' })
  @ApiResponse({
    status: 200,
    description: 'List of all teams in database',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 33 },
          name: { type: 'string', example: 'FC Example' },
          country: { type: 'string', example: 'England' },
          founded: { type: 'integer', example: 1878 },
          logo: { type: 'string', nullable: true },
        },
      },
    },
  })
  getAllTeams() {
    return this.teamsService.findAllTeams();
  }

  @Get(':teamId')
  @ApiOperation({ summary: 'Get team details by ID' })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'integer',
    example: 33,
  })
  @ApiResponse({
    status: 200,
    description: 'Team details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 33 },
        name: { type: 'string', example: 'FC Example' },
        stadium: { type: 'string', example: 'Example Arena' },
        colors: {
          type: 'object',
          properties: {
            primary: { type: 'string', example: '#0044cc' },
            secondary: { type: 'string', example: '#ffffff' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getTeamOverview(@Param() params: TeamIdParamDto) {
    return this.teamsService.getTeamOverview(params.teamId);
  }

  @Get(':teamId/stats')
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'integer',
    example: 33,
  })
  @ApiQuery({
    name: 'leagueId',
    description:
      'League identifier (optional). If not provided, the server may use the environment variable FOOTBALL_API_DEFAULT_LEAGUE or allow the call in mock mode (FOOTBALL_API_MOCK=true).',
    required: false,
    type: 'integer',
    example: 999,
  })
  @ApiQuery({
    name: 'season',
    description: 'Season filter',
    required: false,
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Team statistics',
    schema: {
      type: 'object',
      properties: {
        teamId: { type: 'integer', example: 33 },
        wins: { type: 'integer', example: 12 },
        draws: { type: 'integer', example: 5 },
        losses: { type: 'integer', example: 3 },
        goalsFor: { type: 'integer', example: 36 },
        goalsAgainst: { type: 'integer', example: 18 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getTeamStats(
    @Param() params: TeamIdParamDto,
    @Query() query: TeamStatsQueryDto,
  ) {
    return this.teamsService.getTeamStats(params.teamId, query);
  }

  @Get(':teamId/matches')
  @ApiOperation({ summary: 'Get team matches' })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'integer',
    example: 33,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of matches',
    required: false,
    type: 'integer',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of matches to skip',
    required: false,
    type: 'integer',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of matches',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 12345 },
          homeTeam: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 33 },
              name: { type: 'string', example: 'FC Example' },
            },
          },
          awayTeam: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 44 },
              name: { type: 'string', example: 'Rivals FC' },
            },
          },
          kickoff: {
            type: 'string',
            format: 'date-time',
            example: '2025-11-10T19:45:00Z',
          },
          score: {
            type: 'object',
            properties: {
              home: { type: 'integer', example: 2 },
              away: { type: 'integer', example: 1 },
            },
            nullable: true,
          },
        },
      },
    },
  })
  getTeamFixtures(
    @Param() params: TeamIdParamDto,
    @Query() query: TeamMatchesQueryDto,
  ) {
    return this.teamsService.getTeamFixtures(params.teamId, query);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createTeam(@Body() body: CreateTeamDto) {
    return this.teamsService.createTeam(body);
  }

  @Get(':teamId/db')
  @ApiOperation({ summary: 'Get persisted team data' })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'integer',
    example: 33,
  })
  @ApiResponse({ status: 200, description: 'Persisted team data' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getPersistedTeam(@Param() params: TeamIdParamDto) {
    return this.teamsService.findTeamById(params.teamId);
  }
}
