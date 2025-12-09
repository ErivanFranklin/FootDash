import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfile } from '../entities/user-profile.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let repository: Repository<UserProfile>;

  const mockUserProfile = {
    id: 1,
    userId: 1,
    displayName: 'Test User',
    bio: 'Test bio',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserProfile;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    repository = module.get<Repository<UserProfile>>(
      getRepositoryToken(UserProfile),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return a user profile when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserProfile);

      const result = await service.findByUserId(1);

      expect(result).toEqual(mockUserProfile);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user profile', async () => {
      const createDto = {
        displayName: 'New User',
        bio: 'New bio',
      };

      mockRepository.create.mockReturnValue({
        ...mockUserProfile,
        ...createDto,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        ...createDto,
      });

      const result = await service.create(1, createDto);

      expect(result.displayName).toBe(createDto.displayName);
      expect(result.bio).toBe(createDto.bio);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        ...createDto,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create profile with only displayName', async () => {
      const createDto = {
        displayName: 'Simple User',
      };

      mockRepository.create.mockReturnValue({
        ...mockUserProfile,
        ...createDto,
        bio: null,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        ...createDto,
        bio: null,
      });

      const result = await service.create(1, createDto);

      expect(result.displayName).toBe(createDto.displayName);
      expect(result.bio).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing profile', async () => {
      const updateDto = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      mockRepository.findOne.mockResolvedValue(mockUserProfile);
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.displayName).toBe(updateDto.displayName);
      expect(result.bio).toBe(updateDto.bio);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { displayName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only displayName when bio is not provided', async () => {
      const updateDto = {
        displayName: 'Only Name',
      };

      mockRepository.findOne.mockResolvedValue(mockUserProfile);
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.displayName).toBe(updateDto.displayName);
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar URL', async () => {
      const avatarUrl = '/uploads/avatars/test-avatar.jpg';

      mockRepository.findOne.mockResolvedValue(mockUserProfile);
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        avatarUrl,
      });

      const result = await service.updateAvatar(1, avatarUrl);

      expect(result.avatarUrl).toBe(avatarUrl);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAvatar(999, '/uploads/avatars/test.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar URL', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockUserProfile,
        avatarUrl: '/uploads/avatars/old.jpg',
      });
      mockRepository.save.mockResolvedValue({
        ...mockUserProfile,
        avatarUrl: null,
      });

      const result = await service.deleteAvatar(1);

      expect(result.avatarUrl).toBeNull();
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAvatar(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
