import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
} from 'class-validator';
import { Theme, Language } from '../entities/user-preferences.entity';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  favoriteTeamIds?: number[];

  @IsOptional()
  @IsString()
  timezone?: string;
}
