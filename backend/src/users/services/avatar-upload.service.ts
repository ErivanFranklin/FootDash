import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AvatarUploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'avatars');
  private readonly maxFileSize = 2 * 1024 * 1024; // 2MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  async saveAvatar(file: Express.Multer.File): Promise<string> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }

    // Validate mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, and WEBP are allowed',
      );
    }

    try {
      // Ensure upload directory exists
      await fs.mkdir(this.uploadDir, { recursive: true });

      // Generate unique filename
      const ext = file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${ext}`;
      const filepath = join(this.uploadDir, filename);

      // Save file
      await fs.writeFile(filepath, file.buffer);

      // Return relative URL
      return `/uploads/avatars/${filename}`;
    } catch (_error) {
      // Log and rethrow as a generic internal server error
      // (_error is intentionally prefixed to avoid lint no-unused-vars)
      // eslint-disable-next-line no-console
      console.error('Failed to save avatar:', _error?.message ?? _error);
      throw new InternalServerErrorException('Failed to save avatar');
    }
  }

  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) {
      return;
    }

    try {
      // Extract filename from URL
      const filename = avatarUrl.split('/').pop();
      if (!filename) {
        return;
      }
      const filepath = join(this.uploadDir, filename);

      // Check if file exists and delete
      await fs.access(filepath);
      await fs.unlink(filepath);
    } catch (error) {
      // Silently fail if file doesn't exist
      // eslint-disable-next-line no-console
      console.error('Failed to delete avatar:', error.message);
    }
  }
}
