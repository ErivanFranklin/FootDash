import { Test, TestingModule } from '@nestjs/testing';
import { AvatarUploadService } from './avatar-upload.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';

jest.mock('fs/promises');
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
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockResolvedValue(undefined);
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
      const pngFile = { ...mockFile, mimetype: 'image/png', originalname: 'test.png' };

      const result = await service.saveAvatar(pngFile);

      expect(result).toBe('/uploads/avatars/test-uuid-1234.png');
    });

    it('should save avatar with valid WEBP file', async () => {
      const webpFile = { ...mockFile, mimetype: 'image/webp', originalname: 'test.webp' };

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
  });

  describe('deleteAvatar', () => {
    it('should delete existing avatar file', async () => {
      const avatarUrl = '/uploads/avatars/test-uuid-1234.jpg';

      await expect(service.deleteAvatar(avatarUrl)).resolves.not.toThrow();
    });

    it('should not throw error when deleting non-existent file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(
        service.deleteAvatar('/uploads/avatars/non-existent.jpg'),
      ).resolves.not.toThrow();
    });

    it('should handle avatarUrl without throwing for non-existent path', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));
      
      await expect(service.deleteAvatar('/uploads/avatars/test.jpg')).resolves.not.toThrow();
    });
  });
});
