import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async findByUserId(userId: number): Promise<UserProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }

  async create(
    userId: number,
    createProfileDto: CreateProfileDto,
  ): Promise<UserProfile> {
    const existingProfile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      return existingProfile;
    }

    const profile = this.profileRepository.create({
      userId,
      ...createProfileDto,
    });

    return this.profileRepository.save(profile);
  }

  async update(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const profile = await this.findByUserId(userId);

    Object.assign(profile, updateProfileDto);

    return this.profileRepository.save(profile);
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<UserProfile> {
    const profile = await this.findByUserId(userId);
    profile.avatarUrl = avatarUrl;
    return this.profileRepository.save(profile);
  }

  async deleteAvatar(userId: number): Promise<UserProfile> {
    const profile = await this.findByUserId(userId);
    profile.avatarUrl = null;
    return this.profileRepository.save(profile);
  }
}
