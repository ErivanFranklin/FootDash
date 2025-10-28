import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId!: number;
}
