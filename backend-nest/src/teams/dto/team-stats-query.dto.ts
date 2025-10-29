import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamStatsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leagueId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  season?: number;
}
