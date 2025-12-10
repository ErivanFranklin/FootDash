import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
