import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from '../services/user-preferences.service';
import { Theme } from '../entities/user-preferences.entity';

describe('UserPreferencesController', () => {
  let controller: UserPreferencesController;

  const mockPreferencesService = {
    findByUserId: jest.fn(),
    update: jest.fn(),
    updateTheme: jest.fn(),
    updateNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPreferencesController],
      providers: [
        {
          provide: UserPreferencesService,
          useValue: mockPreferencesService,
        },
      ],
    }).compile();

    controller = module.get<UserPreferencesController>(UserPreferencesController);
    jest.clearAllMocks();
  });

  it('returns user preferences', async () => {
    const prefs = { userId: 1, theme: Theme.AUTO };
    mockPreferencesService.findByUserId.mockResolvedValue(prefs);

    const result = await controller.getPreferences(1);

    expect(result).toEqual(prefs);
    expect(mockPreferencesService.findByUserId).toHaveBeenCalledWith(1);
  });

  it('updates user preferences', async () => {
    const dto = { language: 'pt' };
    const updated = { userId: 1, ...dto };
    mockPreferencesService.update.mockResolvedValue(updated);

    const result = await controller.updatePreferences(1, dto as any);

    expect(result).toEqual(updated);
    expect(mockPreferencesService.update).toHaveBeenCalledWith(1, dto);
  });

  it('rethrows update errors', async () => {
    mockPreferencesService.update.mockRejectedValue(new Error('update failed'));

    await expect(controller.updatePreferences(1, {} as any)).rejects.toThrow(
      'update failed',
    );
  });

  it('updates theme', async () => {
    const updated = { userId: 9, theme: Theme.DARK };
    mockPreferencesService.updateTheme.mockResolvedValue(updated);

    const result = await controller.updateTheme(9, { theme: Theme.DARK } as any);

    expect(result).toEqual(updated);
    expect(mockPreferencesService.updateTheme).toHaveBeenCalledWith(9, Theme.DARK);
  });

  it('updates notification settings', async () => {
    const body = { notificationEnabled: false, emailNotifications: false };
    const updated = { userId: 4, ...body };
    mockPreferencesService.updateNotifications.mockResolvedValue(updated);

    const result = await controller.updateNotifications(4, body as any);

    expect(result).toEqual(updated);
    expect(mockPreferencesService.updateNotifications).toHaveBeenCalledWith(4, body);
  });
});
