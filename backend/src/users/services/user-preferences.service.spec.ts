import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserPreferencesService } from './user-preferences.service';
import {
  UserPreferences,
  Theme,
  Language,
} from '../entities/user-preferences.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  const mockUserPreferences = {
    id: 1,
    userId: 1,
    theme: Theme.AUTO,
    language: Language.EN,
    notificationEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    favoriteTeamIds: [],
    timezone: 'UTC',
    updatedAt: new Date(),
  } as UserPreferences;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesService,
        {
          provide: getRepositoryToken(UserPreferences),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserPreferencesService>(UserPreferencesService);
    // repository is not used by these unit tests; repository access is mocked via mockRepository

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return user preferences when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserPreferences);

      const result = await service.findByUserId(1);

      expect(result).toEqual(mockUserPreferences);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should throw NotFoundException when preferences not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDefault', () => {
    it('should create default preferences for user', async () => {
      const defaultPrefs = {
        ...mockUserPreferences,
        theme: Theme.AUTO,
        language: Language.EN,
        notificationEnabled: true,
      };

      mockRepository.create.mockReturnValue(defaultPrefs);
      mockRepository.save.mockResolvedValue(defaultPrefs);

      const result = await service.createDefault(1);

      expect(result.theme).toBe(Theme.AUTO);
      expect(result.language).toBe(Language.EN);
      expect(result.notificationEnabled).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        theme: Theme.AUTO,
        language: Language.EN,
        notificationEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        favoriteTeamIds: [],
      });
    });
  });

  describe('update', () => {
    it('should update all preferences', async () => {
      const updateDto = {
        theme: Theme.DARK,
        language: Language.ES,
        notificationEnabled: false,
        emailNotifications: false,
        pushNotifications: false,
        favoriteTeamIds: [1, 2, 3],
        timezone: 'America/New_York',
      };

      const prefs = { ...mockUserPreferences };
      mockRepository.findOne.mockResolvedValue(prefs);
      mockRepository.save.mockImplementation(async (p) => p);

      const result = await service.update(1, updateDto);

      expect(result.theme).toBe(Theme.DARK);
      expect(result.language).toBe(Language.ES);
      expect(result.notificationEnabled).toBe(false);
      expect(result.favoriteTeamIds).toEqual([1, 2, 3]);
      expect(result.timezone).toBe('America/New_York');
    });

    it('should throw NotFoundException when preferences do not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { theme: Theme.DARK })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update only provided fields', async () => {
      const updateDto = {
        theme: Theme.LIGHT,
      };

      const prefs = { ...mockUserPreferences };
      mockRepository.findOne.mockResolvedValue(prefs);
      mockRepository.save.mockImplementation(async (p) => p);

      const result = await service.update(1, updateDto);

      expect(result.theme).toBe(Theme.LIGHT);
      expect(result.language).toBe(Language.EN); // unchanged
    });
  });

  describe('updateTheme', () => {
    it('should update only theme', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserPreferences);
      mockRepository.save.mockResolvedValue({
        ...mockUserPreferences,
        theme: Theme.DARK,
      });

      const result = await service.updateTheme(1, Theme.DARK);

      expect(result.theme).toBe(Theme.DARK);
    });

    it('should throw NotFoundException when preferences do not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateTheme(999, Theme.DARK)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateNotifications', () => {
    it('should update all notification settings', async () => {
      const notificationSettings = {
        notificationEnabled: false,
        emailNotifications: false,
        pushNotifications: true,
      };

      const prefs = { ...mockUserPreferences };
      mockRepository.findOne.mockResolvedValue(prefs);
      mockRepository.save.mockImplementation(async (p) => p);

      const result = await service.updateNotifications(1, notificationSettings);

      expect(result.notificationEnabled).toBe(false);
      expect(result.emailNotifications).toBe(false);
      expect(result.pushNotifications).toBe(true);
    });

    it('should throw NotFoundException when preferences do not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateNotifications(999, { notificationEnabled: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided notification fields', async () => {
      const notificationSettings = {
        emailNotifications: false,
      };

      const prefs = { ...mockUserPreferences };
      mockRepository.findOne.mockResolvedValue(prefs);
      mockRepository.save.mockImplementation(async (p) => p);

      const result = await service.updateNotifications(1, notificationSettings);

      expect(result.emailNotifications).toBe(false);
      expect(result.notificationEnabled).toBe(true); // unchanged
      expect(result.pushNotifications).toBe(true); // unchanged
    });
  });
});
