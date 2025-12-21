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

  async findByUserId(userId: number): Promise<any> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    // Return a plain object including the user's email from the joined relation
    const { user, ...profileRest } = profile as any;
    return {
      ...profileRest,
      email: user?.email,
    };
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

  /**
   * Resolve user IDs by display names (case-insensitive). Returns a map of lowercased displayName -> userId
   */
  async findUserIdsByDisplayNames(
    displayNames: string[],
  ): Promise<Map<string, number>> {
    if (!displayNames.length) return new Map();
    const namesLower = displayNames.map((n) => n.toLowerCase());
    const qb = this.profileRepository
      .createQueryBuilder('p')
      .select(['p.userId as userId', 'LOWER(p.displayName) as name'])
      .where('p.displayName IS NOT NULL')
      .andWhere('LOWER(p.displayName) IN (:...names)', { names: namesLower });
    const rows = await qb.getRawMany();
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.name, Number(r.userId));
    }
    return map;
  }

  /**
   * Return displayName if available, else fallback to email local-part or 'Unknown'.
   * Does not throw if profile missing.
   */
  async getDisplayNameFallback(
    userId: number,
    email?: string,
  ): Promise<string> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (profile?.displayName) return profile.displayName;
    if (email) {
      const local = email.split('@')[0];
      if (local) return local;
    }
    return 'Unknown';
  }
}
