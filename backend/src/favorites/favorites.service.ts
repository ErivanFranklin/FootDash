import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite, FavoriteEntityType } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favRepo: Repository<Favorite>,
  ) {}

  async addFavorite(
    userId: number,
    entityType: FavoriteEntityType,
    entityId: number,
  ): Promise<Favorite> {
    const existing = await this.favRepo.findOne({
      where: { userId, entityType, entityId },
    });
    if (existing) {
      throw new ConflictException('Already favorited');
    }
    const fav = this.favRepo.create({ userId, entityType, entityId });
    return this.favRepo.save(fav);
  }

  async removeFavorite(
    userId: number,
    entityType: FavoriteEntityType,
    entityId: number,
  ): Promise<void> {
    await this.favRepo.delete({ userId, entityType, entityId });
  }

  async getUserFavorites(
    userId: number,
    entityType?: FavoriteEntityType,
  ): Promise<Favorite[]> {
    const where: any = { userId };
    if (entityType) where.entityType = entityType;
    return this.favRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async isFavorite(
    userId: number,
    entityType: FavoriteEntityType,
    entityId: number,
  ): Promise<boolean> {
    const count = await this.favRepo.count({
      where: { userId, entityType, entityId },
    });
    return count > 0;
  }

  async getFavoriteTeamIds(userId: number): Promise<number[]> {
    const favs = await this.favRepo.find({
      where: { userId, entityType: FavoriteEntityType.TEAM },
      select: ['entityId'],
    });
    return favs.map((f) => f.entityId);
  }
}
