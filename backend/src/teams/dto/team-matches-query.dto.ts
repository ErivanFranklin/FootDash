import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum FixtureStatusFilter {
  PLAYED = 'FT',
  SCHEDULED = 'NS',
}

export class TeamMatchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  season?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  last?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  next?: number;

  @IsOptional()
  @IsEnum(FixtureStatusFilter)
  status?: FixtureStatusFilter;
}
