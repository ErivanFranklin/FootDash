import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shortCode?: string;
}
