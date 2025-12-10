import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { User } from '../../users/user.entity';
import { CreateFollowDto, FollowStatsDto } from '../dto/follow.dto';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async followUser(followerId: number, dto: CreateFollowDto): Promise<Follow> {
    const { followingId } = dto;

    // Can't follow yourself
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if following user exists
    const userToFollow = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    const follow = this.followRepository.create({
      followerId,
      followingId,
    });

    return this.followRepository.save(follow);
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(follow);
  }

  async getFollowers(userId: number, page: number = 1, limit: number = 20): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return follows.map(f => f.follower);
  }

  async getFollowing(userId: number, page: number = 1, limit: number = 20): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return follows.map(f => f.following);
  }

  async getFollowerCount(userId: number): Promise<number> {
    return this.followRepository.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: number): Promise<number> {
    return this.followRepository.count({
      where: { followerId: userId },
    });
  }

  async getFollowStats(userId: number): Promise<FollowStatsDto> {
    const [followers, following] = await Promise.all([
      this.getFollowerCount(userId),
      this.getFollowingCount(userId),
    ]);

    return { followers, following };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    return !!follow;
  }

  async getFollowingIds(userId: number): Promise<number[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    return follows.map(f => f.followingId);
  }
}
