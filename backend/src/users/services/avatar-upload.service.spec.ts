import { Test, TestingModule } from '@nestjs/testing';
import { AvatarUploadService } from './avatar-upload.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { Readable } from 'stream';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    access: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('AvatarUploadService', () => {
  let service: AvatarUploadService;

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'test-avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from('fake-image-data'),
    stream: new Readable(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvatarUploadService],
    }).compile();

    service = module.get<AvatarUploadService>(AvatarUploadService);

    jest.clearAllMocks();
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.unlink as any).mockResolvedValue(undefined);
    (fs.access as any).mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveAvatar', () => {
    it('should save avatar with valid JPG file', async () => {
      const result = await service.saveAvatar(mockFile);

      expect(result).toBe('/uploads/avatars/test-uuid-1234.jpg');
    });

    it('should save avatar with valid PNG file', async () => {
      const pngFile = {
        ...mockFile,
        mimetype: 'image/png',
        originalname: 'test.png',
      };

      const result = await service.saveAvatar(pngFile);

      expect(result).toBe('/uploads/avatars/test-uuid-1234.png');
    });

    it('should save avatar with valid WEBP file', async () => {
      const webpFile = {
        ...mockFile,
        mimetype: 'image/webp',
        originalname: 'test.webp',
      };

      const result = await service.saveAvatar(webpFile);

      expect(result).toBe('/uploads/avatars/test-uuid-1234.webp');
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 3 * 1024 * 1024, // 3MB
      };

      await expect(service.saveAvatar(largeFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveAvatar(largeFile)).rejects.toThrow(
        'File size exceeds 2MB limit',
      );
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'image/gif',
        originalname: 'test.gif',
      };

      await expect(service.saveAvatar(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveAvatar(invalidFile)).rejects.toThrow(
        'Invalid file type. Only JPG, PNG, and WEBP are allowed',
      );
    });

    it('should throw BadRequestException for text/plain mimetype', async () => {
      const textFile = {
        ...mockFile,
        mimetype: 'text/plain',
        originalname: 'test.txt',
      };

      await expect(service.saveAvatar(textFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for application/pdf mimetype', async () => {
      const pdfFile = {
        ...mockFile,
        mimetype: 'application/pdf',
        originalname: 'test.pdf',
      };

      await expect(service.saveAvatar(pdfFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle file size exactly at limit', async () => {
      const maxSizeFile = {
        ...mockFile,
        size: 2 * 1024 * 1024, // Exactly 2MB
      };

      const result = await service.saveAvatar(maxSizeFile);
      expect(result).toBe('/uploads/avatars/test-uuid-1234.jpg');
    });

    it('should handle file size just under limit', async () => {
      const underLimitFile = {
        ...mockFile,
        size: 2 * 1024 * 1024 - 1, // Just under 2MB
      };

      const result = await service.saveAvatar(underLimitFile);

      expect(result).toBe('/uploads/avatars/test-uuid-1234.jpg');
    });

    it('should throw InternalServerErrorException if filesystem operation fails', async () => {
      (fs.writeFile as any).mockRejectedValueOnce(new Error('Write error'));
      await expect(service.saveAvatar(mockFile)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle error as string in catch block', async () => {
      (fs.writeFile as any).mockRejectedValueOnce('Some string error');
      await expect(service.saveAvatar(mockFile)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete existing avatar file', async () => {
      const avatarUrl = '/uploads/avatars/test-uuid-1234.jpg';

      await expect(service.deleteAvatar(avatarUrl)).resolves.not.toThrow();
    });

    it('should not throw error when deleting non-existent file', async () => {
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(
        service.deleteAvatar('/uploads/avatars/non-existent.jpg'),
      ).resolves.not.toThrow();
    });

    it('should handle avatarUrl without throwing for non-existent path', async () => {
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(
        service.deleteAvatar('/uploads/avatars/test.jpg'),
      ).resolves.not.toThrow();
    });

    it('should return early if avatarUrl is empty', async () => {
      await service.deleteAvatar('');
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should return early if filename extraction fails', async () => {
      // With 'invalid-url-no-slash', .pop() returns 'invalid-url-no-slash'
      // which is truthy, so filename exists and it proceeds.
      // To fail filename check, we need .pop() to be falsy.
      // .split('/') on empty string gives [''], .pop() gives '' (falsy)
      // But we already have a test for empty string.
      // Let's test special case like '/'
      await service.deleteAvatar('/');
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should handle non-Error rejection in deleteAvatar', async () => {
      (fs.access as any).mockRejectedValueOnce('access-denied');
      await expect(service.deleteAvatar('/uploads/avatars/test.jpg')).resolves.not.toThrow();
    });
  });
});
