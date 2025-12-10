import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserProfileService } from '../services/user-profile.service';
import { AvatarUploadService } from '../services/avatar-upload.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Controller('users/:userId/profile')
export class UserProfileController {
  constructor(
    private readonly profileService: UserProfileService,
    private readonly avatarService: AvatarUploadService,
  ) {}

  @Get()
  async getProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.profileService.findByUserId(userId);
  }

  @Put()
  async updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      return await this.profileService.update(userId, updateProfileDto);
    } catch (error) {
      // If profile doesn't exist, create it
      if (error.status === 404) {
        return this.profileService.create(userId, updateProfileDto);
      }
      throw error;
    }
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Delete old avatar if exists
      const existingProfile = await this.profileService.findByUserId(userId);
      if (existingProfile.avatarUrl) {
        await this.avatarService.deleteAvatar(existingProfile.avatarUrl);
      }

      // Save new avatar
      const avatarUrl = await this.avatarService.saveAvatar(file);

      // Update profile with new avatar URL
      return this.profileService.updateAvatar(userId, avatarUrl);
    } catch (error) {
      // If profile doesn't exist, create it with the avatar
      if (error.status === 404) {
        const avatarUrl = await this.avatarService.saveAvatar(file);
        await this.profileService.create(userId, {});
        return this.profileService.updateAvatar(userId, avatarUrl);
      }
      throw error;
    }
  }

  @Delete('avatar')
  async deleteAvatar(@Param('userId', ParseIntPipe) userId: number) {
    const profile = await this.profileService.findByUserId(userId);

    if (profile.avatarUrl) {
      await this.avatarService.deleteAvatar(profile.avatarUrl);
    }

    return this.profileService.deleteAvatar(userId);
  }
}
