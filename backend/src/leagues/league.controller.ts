import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LeagueService } from './league.service';

@ApiTags('Leagues')
@Controller('leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get()
  @ApiOperation({ summary: 'List all leagues (featured first)' })
  @ApiResponse({ status: 200, description: 'Leagues retrieved' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  async getLeagues(@Query('featured') featured?: string) {
    if (featured === 'true') {
      return this.leagueService.findFeatured();
    }
    return this.leagueService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get league by ID' })
  @ApiResponse({ status: 200, description: 'League retrieved' })
  async getLeague(@Param('id', ParseIntPipe) id: number) {
    return this.leagueService.findById(id);
  }

  @Get(':id/standings')
  @ApiOperation({ summary: 'Get league standings' })
  @ApiResponse({ status: 200, description: 'Standings retrieved' })
  async getStandings(@Param('id', ParseIntPipe) id: number) {
    return this.leagueService.getStandings(id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Get league matches / fixtures' })
  @ApiResponse({ status: 200, description: 'Fixtures retrieved' })
  @ApiQuery({ name: 'round', required: false, type: String })
  async getFixtures(
    @Param('id', ParseIntPipe) id: number,
    @Query('round') round?: string,
  ) {
    return this.leagueService.getFixtures(id, round);
  }
}
