import { IsNumber, IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PerformanceStatsDto {
  @ApiProperty()
  @IsNumber()
  played: number;

  @ApiProperty()
  @IsNumber()
  won: number;

  @ApiProperty()
  @IsNumber()
  drawn: number;

  @ApiProperty()
  @IsNumber()
  lost: number;

  @ApiProperty()
  @IsNumber()
  goalsFor: number;

  @ApiProperty()
  @IsNumber()
  goalsAgainst: number;

  @ApiProperty()
  @IsNumber()
  goalDifference: number;

  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty()
  @IsNumber()
  winPercentage: number;
}

export class ScoringTrendDto {
  @ApiProperty({ type: [Number] })
  last5Matches: number[];

  @ApiProperty()
  @IsNumber()
  average: number;

  @ApiProperty({ enum: ['up', 'down', 'stable'] })
  trend: 'up' | 'down' | 'stable';
}

export class TeamAnalyticsDto {
  @ApiProperty()
  @IsNumber()
  teamId: number;

  @ApiProperty()
  @IsString()
  teamName: string;

  @ApiProperty()
  @IsString()
  season: string;

  @ApiProperty()
  @IsNumber()
  formRating: number;

  @ApiProperty({ type: PerformanceStatsDto })
  @IsObject()
  homePerformance: PerformanceStatsDto;

  @ApiProperty({ type: PerformanceStatsDto })
  @IsObject()
  awayPerformance: PerformanceStatsDto;

  @ApiProperty({ type: PerformanceStatsDto })
  @IsObject()
  overallStats: PerformanceStatsDto;

  @ApiProperty({ type: ScoringTrendDto })
  @IsObject()
  scoringTrend: ScoringTrendDto;

  @ApiProperty()
  @IsNumber()
  defensiveRating: number;

  @ApiProperty()
  lastUpdated: Date;
}

export class UpdateTeamAnalyticsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  season?: string;
}
