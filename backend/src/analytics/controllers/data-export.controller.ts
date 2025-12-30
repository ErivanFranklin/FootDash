import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  ParseArrayPipe,
  ParseIntPipe,
  ParseBoolPipe,
  BadRequestException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';
import { DataExportService, TrainingDataExportParams } from '../services/data-export.service';
import { Readable } from 'stream';

@ApiTags('Analytics - Data Export')
@Controller('analytics/export')
@UseGuards(JwtAuthGuard, AdminGuard) // Only admins can export training data
@ApiBearerAuth()
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  @Post('training-data')
  @ApiOperation({ 
    summary: 'Export training data for ML model training',
    description: 'Exports historical match data with features for machine learning model training. Admin only.'
  })
  @ApiResponse({
    status: 200,
    description: 'Training data exported successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' }
        },
        metadata: {
          type: 'object',
          properties: {
            total_matches: { type: 'number' },
            date_range: { 
              type: 'object',
              properties: {
                start: { type: 'string' },
                end: { type: 'string' }
              }
            },
            leagues: { type: 'array', items: { type: 'number' } },
            seasons: { type: 'array', items: { type: 'string' } },
            export_timestamp: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async exportTrainingData(
    @Body() params: {
      seasons?: string[];
      leagues?: number[];
      includeOngoing?: boolean;
      startDate?: string;
      endDate?: string;
      minMatchesPerTeam?: number;
      format?: 'json' | 'csv';
    },
  ) {
    // Validate and prepare parameters
    const exportParams: TrainingDataExportParams = {
      seasons: params.seasons,
      leagues: params.leagues,
      includeOngoing: params.includeOngoing || false,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      minMatchesPerTeam: params.minMatchesPerTeam || 5,
      format: params.format || 'json',
    };

    // Validate date range
    if (exportParams.startDate && exportParams.endDate && 
        exportParams.startDate > exportParams.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate minimum matches per team
    if (exportParams.minMatchesPerTeam < 1 || exportParams.minMatchesPerTeam > 50) {
      throw new BadRequestException('minMatchesPerTeam must be between 1 and 50');
    }

    return await this.dataExportService.exportTrainingData(exportParams);
  }

  @Get('training-data/csv')
  @ApiOperation({ 
    summary: 'Export training data as CSV file download',
    description: 'Exports historical match data as a downloadable CSV file for ML training. Admin only.'
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': { description: 'attachment; filename="training-data.csv"' },
    },
  })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="footdash-training-data.csv"')
  async exportTrainingDataCSV(
    @Query('seasons', new ParseArrayPipe({ items: String, separator: ',' })) seasons?: string[],
    @Query('leagues', new ParseArrayPipe({ items: Number, separator: ',' })) leagues?: number[],
    @Query('includeOngoing', new ParseBoolPipe()) includeOngoing = false,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minMatchesPerTeam', new ParseIntPipe()) minMatchesPerTeam = 5,
  ): Promise<StreamableFile> {
    const exportParams: TrainingDataExportParams = {
      seasons: seasons?.length ? seasons : undefined,
      leagues: leagues?.length ? leagues : undefined,
      includeOngoing,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minMatchesPerTeam,
      format: 'csv',
    };

    // Validate inputs
    if (exportParams.startDate && exportParams.endDate && 
        exportParams.startDate > exportParams.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Export data
    const result = await this.dataExportService.exportTrainingData(exportParams);
    
    // Convert to CSV
    const csvContent = this.dataExportService.convertToCSV(result.data);
    
    // Create streamable file
    const stream = Readable.from([csvContent]);
    return new StreamableFile(stream);
  }

  @Get('training-data/sample')
  @ApiOperation({ 
    summary: 'Get sample training data structure',
    description: 'Returns a sample of training data structure for development purposes. Admin only.'
  })
  @ApiResponse({
    status: 200,
    description: 'Sample data structure retrieved',
    schema: {
      type: 'object',
      properties: {
        sample_data: { type: 'array', items: { type: 'object' } },
        feature_descriptions: { type: 'object' },
        total_features: { type: 'number' }
      }
    }
  })
  async getSampleTrainingData() {
    // Export just a small sample for structure reference
    const result = await this.dataExportService.exportTrainingData({
      includeOngoing: false,
      minMatchesPerTeam: 1
    });

    const sampleData = result.data.slice(0, 5); // Just first 5 records

    return {
      sample_data: sampleData,
      feature_descriptions: {
        match_id: 'Unique match identifier',
        home_team_id: 'Home team ID',
        away_team_id: 'Away team ID',
        league_id: 'League/competition ID',
        season: 'Season string (e.g., "2023-24")',
        match_date: 'Match date in ISO format',
        outcome: 'Target variable: HOME_WIN, DRAW, or AWAY_WIN',
        home_form_rating: 'Home team form rating (0-100)',
        away_form_rating: 'Away team form rating (0-100)',
        home_win_rate: 'Home team win percentage',
        away_win_rate: 'Away team win percentage',
        home_goals_avg: 'Home team average goals scored per game',
        away_goals_avg: 'Away team average goals scored per game',
        home_goals_conceded_avg: 'Home team average goals conceded per game',
        away_goals_conceded_avg: 'Away team average goals conceded per game',
        h2h_home_wins: 'Historical head-to-head wins for home team',
        h2h_away_wins: 'Historical head-to-head wins for away team',
        h2h_draws: 'Historical head-to-head draws',
        form_difference: 'Home form rating - Away form rating',
        goal_difference: 'Home goals avg - Away goals avg',
        defensive_strength_difference: 'Away goals conceded - Home goals conceded',
        h2h_advantage: 'Head-to-head advantage (-1 to 1)',
        is_home: 'Whether team is playing at home (always true for home team perspective)',
        days_since_last_match: 'Days since either team last played',
        league_strength: 'League strength rating (0-1)',
        season_stage: 'Stage of season (0=early, 0.5=mid, 1=late)',
      },
      total_features: Object.keys(sampleData[0] || {}).length,
      metadata: result.metadata
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get export statistics and available data',
    description: 'Returns statistics about available data for export. Admin only.'
  })
  @ApiResponse({
    status: 200,
    description: 'Export statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        total_finished_matches: { type: 'number' },
        available_seasons: { type: 'array', items: { type: 'string' } },
        available_leagues: { type: 'array', items: { type: 'number' } },
        date_range: { 
          type: 'object',
          properties: {
            earliest: { type: 'string' },
            latest: { type: 'string' }
          }
        },
        teams_with_sufficient_history: { type: 'number' }
      }
    }
  })
  async getExportStats(
    @Query('minMatchesPerTeam', new ParseIntPipe()) minMatchesPerTeam = 5,
  ) {
    // Get basic statistics without full export
    const statsQuery = await this.dataExportService['matchRepository']
      .createQueryBuilder('match')
      .select([
        'COUNT(*) as total_matches',
        'MIN(match.kickOff) as earliest_date',
        'MAX(match.kickOff) as latest_date',
        'COUNT(DISTINCT match.season) as season_count',
        'COUNT(DISTINCT match.league.id) as league_count'
      ])
      .leftJoin('match.league', 'league')
      .where('match.status IN (:...statuses)', { statuses: ['FINISHED', 'FT'] })
      .andWhere('match.homeScore IS NOT NULL')
      .andWhere('match.awayScore IS NOT NULL')
      .getRawOne();

    const seasons = await this.dataExportService['matchRepository']
      .createQueryBuilder('match')
      .select('DISTINCT match.season', 'season')
      .where('match.status IN (:...statuses)', { statuses: ['FINISHED', 'FT'] })
      .andWhere('match.season IS NOT NULL')
      .orderBy('match.season', 'DESC')
      .getRawMany();

    const leagues = await this.dataExportService['matchRepository']
      .createQueryBuilder('match')
      .select('DISTINCT league.id', 'league_id')
      .leftJoin('match.league', 'league')
      .where('match.status IN (:...statuses)', { statuses: ['FINISHED', 'FT'] })
      .andWhere('league.id IS NOT NULL')
      .orderBy('league.id', 'ASC')
      .getRawMany();

    return {
      total_finished_matches: parseInt(statsQuery.total_matches || 0),
      available_seasons: seasons.map(s => s.season).filter(Boolean),
      available_leagues: leagues.map(l => parseInt(l.league_id)).filter(Boolean),
      date_range: {
        earliest: statsQuery.earliest_date || null,
        latest: statsQuery.latest_date || null,
      },
      min_matches_threshold: minMatchesPerTeam,
      last_updated: new Date().toISOString(),
    };
  }
}