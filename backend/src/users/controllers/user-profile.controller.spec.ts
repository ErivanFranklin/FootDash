import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException } from '@nestjs/common';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from '../services/user-profile.service';
import { AvatarUploadService } from '../services/avatar-upload.service';

describe('UserProfileController', () => {
  let controller: UserProfileController;

  const mockProfileService = {
    findByUserId: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    updateAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
  };

  const mockAvatarService = {
    saveAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        { provide: UserProfileService, useValue: mockProfileService },
        { provide: AvatarUploadService, useValue: mockAvatarService },
      ],
    }).compile();

    controller = module.get<UserProfileController>(UserProfileController);
    jest.clearAllMocks();
  });

  it('gets profile by user id', async () => {
    const profile = { userId: 2, displayName: 'User 2' };
    mockProfileService.findByUserId.mockResolvedValue(profile);

    const result = await controller.getProfile(2);

    expect(result).toEqual(profile);
    expect(mockProfileService.findByUserId).toHaveBeenCalledWith(2);
  });

  it('updates profile when profile exists', async () => {
    const dto = { displayName: 'Updated' };
    mockProfileService.update.mockResolvedValue({ userId: 1, ...dto });

    const result = await controller.updateProfile(1, dto as any);

    expect(result).toEqual({ userId: 1, ...dto });
    expect(mockProfileService.update).toHaveBeenCalledWith(1, dto);
    expect(mockProfileService.create).not.toHaveBeenCalled();
  });

  it('creates profile when update returns 404', async () => {
    const dto = { bio: 'new bio' };
    mockProfileService.update.mockRejectedValue(new HttpException('Not found', 404));
    mockProfileService.create.mockResolvedValue({ userId: 3, ...dto });

    const result = await controller.updateProfile(3, dto as any);

    expect(mockProfileService.create).toHaveBeenCalledWith(3, dto);
    expect(result).toEqual({ userId: 3, ...dto });
  });

  it('rethrows update errors other than 404', async () => {
    mockProfileService.update.mockRejectedValue(new HttpException('Bad', 400));

    await expect(controller.updateProfile(1, {} as any)).rejects.toThrow(HttpException);
  });

  it('throws bad request when avatar file is missing', async () => {
    await expect(controller.uploadAvatar(1, undefined as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('replaces existing avatar and updates profile', async () => {
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    mockProfileService.findByUserId.mockResolvedValue({ userId: 1, avatarUrl: '/old.png' });
    mockAvatarService.saveAvatar.mockResolvedValue('/new.png');
    mockProfileService.updateAvatar.mockResolvedValue({ userId: 1, avatarUrl: '/new.png' });

    const result = await controller.uploadAvatar(1, file);

    expect(mockAvatarService.deleteAvatar).toHaveBeenCalledWith('/old.png');
    expect(mockAvatarService.saveAvatar).toHaveBeenCalledWith(file);
    expect(mockProfileService.updateAvatar).toHaveBeenCalledWith(1, '/new.png');
    expect(result).toEqual({ userId: 1, avatarUrl: '/new.png' });
  });

  it('creates profile when missing during avatar upload', async () => {
    const file = { originalname: 'avatar.png' } as Express.Multer.File;
    mockProfileService.findByUserId.mockRejectedValue(new HttpException('Not found', 404));
    mockAvatarService.saveAvatar.mockResolvedValue('/new.png');
    mockProfileService.create.mockResolvedValue({ userId: 4 });
    mockProfileService.updateAvatar.mockResolvedValue({ userId: 4, avatarUrl: '/new.png' });

    const result = await controller.uploadAvatar(4, file);

    expect(mockProfileService.create).toHaveBeenCalledWith(4, {});
    expect(mockProfileService.updateAvatar).toHaveBeenCalledWith(4, '/new.png');
    expect(result).toEqual({ userId: 4, avatarUrl: '/new.png' });
  });

  it('deletes avatar when profile has avatarUrl', async () => {
    mockProfileService.findByUserId.mockResolvedValue({ userId: 5, avatarUrl: '/to-remove.png' });
    mockProfileService.deleteAvatar.mockResolvedValue({ userId: 5, avatarUrl: null });

    const result = await controller.deleteAvatar(5);

    expect(mockAvatarService.deleteAvatar).toHaveBeenCalledWith('/to-remove.png');
    expect(mockProfileService.deleteAvatar).toHaveBeenCalledWith(5);
    expect(result).toEqual({ userId: 5, avatarUrl: null });
  });

  it('deletes avatar field even when no physical file exists', async () => {
    mockProfileService.findByUserId.mockResolvedValue({ userId: 6, avatarUrl: null });
    mockProfileService.deleteAvatar.mockResolvedValue({ userId: 6, avatarUrl: null });

    await controller.deleteAvatar(6);

    expect(mockAvatarService.deleteAvatar).not.toHaveBeenCalled();
    expect(mockProfileService.deleteAvatar).toHaveBeenCalledWith(6);
  });
});
