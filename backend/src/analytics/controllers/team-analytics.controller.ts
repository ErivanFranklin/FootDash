import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TeamAnalyticsService } from '../services/team-analytics.service';
import { TeamAnalyticsDto } from '../dto/team-analytics.dto';

@ApiTags('Analytics - Team Analytics')
@Controller('analytics/team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamAnalyticsController {
  constructor(private readonly teamAnalyticsService: TeamAnalyticsService) {}

  @Get(':teamId')
  @ApiOperation({ summary: 'Get comprehensive team analytics' })
  @ApiResponse({ status: 200, description: 'Team analytics retrieved successfully', type: TeamAnalyticsDto })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async getTeamAnalytics(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('season') season?: string,
  ) {
    return await this.teamAnalyticsService.getTeamAnalytics(teamId, season);
  }

  @Get(':teamId/form')
  @ApiOperation({ summary: 'Get recent form analysis for a team' })
  @ApiResponse({ status: 200, description: 'Form data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async getTeamForm(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('lastN', ParseIntPipe) lastN = 5,
  ) {
    return await this.teamAnalyticsService.getTeamForm(teamId, lastN);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two teams' })
  @ApiResponse({ status: 200, description: 'Comparison data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async compareTeams(
    @Query('team1', ParseIntPipe) team1Id: number,
    @Query('team2', ParseIntPipe) team2Id: number,
    @Query('season') season?: string,
  ) {
    return await this.teamAnalyticsService.compareTeams(team1Id, team2Id, season);
  }

  @Post('refresh-all')
  @ApiOperation({ summary: 'Refresh analytics for all teams (admin operation)' })
  @ApiResponse({ status: 200, description: 'Analytics refreshed successfully' })
  async refreshAllAnalytics(@Query('season') season?: string) {
    const count = await this.teamAnalyticsService.refreshAllTeamAnalytics(season);
    return { message: `Refreshed analytics for ${count} teams`, count };
  }
}
