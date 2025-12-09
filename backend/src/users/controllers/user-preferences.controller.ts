import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { UserPreferencesService } from '../services/user-preferences.service';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { Theme } from '../entities/user-preferences.entity';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';

class UpdateThemeDto {
  @IsEnum(Theme)
  theme: Theme;
}

class UpdateNotificationsDto {
  @IsBoolean()
  @IsOptional()
  notificationEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;
}

@Controller('users/:userId/preferences')
export class UserPreferencesController {
  constructor(
    private readonly preferencesService: UserPreferencesService,
  ) {}

  @Get()
  async getPreferences(@Param('userId', ParseIntPipe) userId: number) {
    return this.preferencesService.findByUserId(userId);
  }

  @Put()
  async updatePreferences(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    try {
      return await this.preferencesService.update(userId, updatePreferencesDto);
    } catch (error) {
      if (error.status === 404) {
        await this.preferencesService.createDefault(userId);
        return this.preferencesService.update(userId, updatePreferencesDto);
      }
      throw error;
    }
  }

  @Patch('theme')
  async updateTheme(
    @Param('userId', ParseIntPipe) userId: number,
    @Body(new ValidationPipe({ transform: true })) body: UpdateThemeDto,
  ) {
    return this.preferencesService.updateTheme(userId, body.theme);
  }

  @Patch('notifications')
  async updateNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Body(new ValidationPipe({ transform: true })) body: UpdateNotificationsDto,
  ) {
    return this.preferencesService.updateNotifications(userId, body);
  }
}
