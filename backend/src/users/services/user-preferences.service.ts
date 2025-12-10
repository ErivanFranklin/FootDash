import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserPreferences,
  Theme,
  Language,
} from '../entities/user-preferences.entity';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  async findByUserId(userId: number): Promise<UserPreferences> {
    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException(`Preferences for user ${userId} not found`);
    }

    return preferences;
  }

  async createDefault(userId: number): Promise<UserPreferences> {
    const existingPreferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (existingPreferences) {
      return existingPreferences;
    }

    const preferences = this.preferencesRepository.create({
      userId,
      theme: Theme.AUTO,
      language: Language.EN,
      notificationEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      favoriteTeamIds: [],
    });

    return this.preferencesRepository.save(preferences);
  }

  async update(
    userId: number,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    let preferences: UserPreferences;

    try {
      preferences = await this.findByUserId(userId);
    } catch (error) {
      // If preferences do not exist, create default preferences then apply updates
      if (error instanceof NotFoundException) {
        preferences = await this.createDefault(userId);
      } else {
        throw error;
      }
    }

    Object.assign(preferences, updatePreferencesDto);

    return this.preferencesRepository.save(preferences);
  }

  async updateTheme(userId: number, theme: Theme): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId);
    preferences.theme = theme;
    return this.preferencesRepository.save(preferences);
  }

  async updateNotifications(
    userId: number,
    notificationSettings: Partial<
      Pick<
        UserPreferences,
        'notificationEnabled' | 'emailNotifications' | 'pushNotifications'
      >
    >,
  ): Promise<UserPreferences> {
    const preferences = await this.findByUserId(userId);
    Object.assign(preferences, notificationSettings);
    return this.preferencesRepository.save(preferences);
  }
}
