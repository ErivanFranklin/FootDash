import { IsNumber, IsString, IsEnum, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PredictionConfidence } from '../entities/match-prediction.entity';

export class PredictionResultDto {
  @ApiProperty()
  @IsNumber()
  matchId: number;

  @ApiProperty()
  @IsString()
  homeTeam: string;

  @ApiProperty()
  @IsString()
  awayTeam: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  homeWinProbability: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  drawProbability: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  awayWinProbability: number;

  @ApiProperty({ enum: PredictionConfidence })
  @IsEnum(PredictionConfidence)
  confidence: PredictionConfidence;

  @ApiProperty({ type: [String] })
  @IsArray()
  insights: string[];

  @ApiProperty({ enum: ['home', 'draw', 'away'] })
  @IsEnum(['home', 'draw', 'away'])
  mostLikely: 'home' | 'draw' | 'away';

  @ApiProperty()
  createdAt: Date;
}

export class CreatePredictionDto {
  @ApiProperty()
  @IsNumber()
  matchId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  forceRecalculate?: boolean;
}
