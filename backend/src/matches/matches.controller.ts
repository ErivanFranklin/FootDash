import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { MatchesQueryDto } from './dto/matches-query.dto';
import { TeamIdParamDto } from '../teams/dto/team-id-param.dto';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single match by ID' })
  @ApiParam({
    name: 'id',
    description: 'Match ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'The match',
  })
  getMatch(@Param('id') id: number) {
    return this.matchesService.getMatch(id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get matches for a specific team' })
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
  getMatchesForTeam(
    @Param() params: TeamIdParamDto,
    @Query() query: MatchesQueryDto,
  ) {
    return this.matchesService.getTeamMatches(params.teamId, query);
  }

  @Post('team/:teamId/sync')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sync team fixtures from external API' })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'integer',
    example: 33,
  })
  @ApiResponse({ status: 200, description: 'Fixtures synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  syncTeamFixtures(
    @Param() params: TeamIdParamDto,
    @Query() query: MatchesQueryDto,
  ) {
    return this.matchesService.syncFixturesFromApi(params.teamId, query);
  }
}
