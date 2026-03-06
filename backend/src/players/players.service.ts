import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  async list(query: {
    position?: string;
    search?: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<Player[]> {
    const qb = this.playersRepo
      .createQueryBuilder('p')
      .where('p.is_active = true')
      .orderBy('p.form', 'DESC')
      .addOrderBy('p.price', 'ASC')
      .take(Math.max(1, Math.min(200, query.limit ?? 50)));

    if (query.position) {
      qb.andWhere('p.position = :position', { position: query.position.toUpperCase() });
    }

    if (query.search?.trim()) {
      qb.andWhere('LOWER(p.name) LIKE :search', {
        search: `%${query.search.trim().toLowerCase()}%`,
      });
    }

    if (typeof query.maxPrice === 'number' && Number.isFinite(query.maxPrice)) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    return qb.getMany();
  }
}
