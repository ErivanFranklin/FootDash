import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { League } from './entities/league.entity';
import { FootballApiService } from '../football-api/football-api.service';

@Injectable()
export class LeagueService {
  private readonly logger = new Logger(LeagueService.name);

  /** Featured league external IDs — seeded on first sync. */
  private readonly featuredIds = [39, 140, 135, 78, 61, 2, 3];

  constructor(
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    private readonly footballApi: FootballApiService,
  ) {}

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async findAll(): Promise<League[]> {
    return this.leagueRepo.find({ order: { isFeatured: 'DESC', name: 'ASC' } });
  }

  async findFeatured(): Promise<League[]> {
    return this.leagueRepo.find({
      where: { isFeatured: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<League> {
    const league = await this.leagueRepo.findOne({ where: { id } });
    if (!league) throw new NotFoundException(`League ${id} not found`);
    return league;
  }

  async findByExternalId(externalId: number): Promise<League | null> {
    return this.leagueRepo.findOne({ where: { externalId } });
  }

  // ── Standings & Fixtures (proxy to Football API) ──────────────────────────

  async getStandings(leagueId: number) {
    const league = await this.findById(leagueId);
    return this.footballApi.getLeagueStandings(
      league.externalId,
      Number(league.season),
    );
  }

  async getFixtures(leagueId: number, round?: string) {
    const league = await this.findById(leagueId);
    return this.footballApi.getLeagueFixtures(
      league.externalId,
      Number(league.season),
      round,
    );
  }

  // ── Sync / Seed ───────────────────────────────────────────────────────────

  /**
   * Sync league metadata from the Football API.
   * Runs daily at 04:00 UTC and on app startup (if table is empty).
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async syncLeagues(): Promise<void> {
    this.logger.log('Starting league sync…');

    try {
      const apiLeagues = await this.footballApi.getLeagues();

      for (const item of apiLeagues) {
        const extId = item.league?.id;
        if (!extId) continue;

        let league = await this.leagueRepo.findOne({
          where: { externalId: extId },
        });

        if (!league) {
          league = this.leagueRepo.create({
            externalId: extId,
            name: item.league.name,
            country: item.country?.name ?? null,
            logo: item.league.logo ?? null,
            type: item.league.type ?? null,
            isFeatured: this.featuredIds.includes(extId),
          });
        } else {
          league.name = item.league.name;
          league.country = item.country?.name ?? league.country;
          league.logo = item.league.logo ?? league.logo;
        }

        league.lastSyncAt = new Date();
        await this.leagueRepo.save(league);
      }

      this.logger.log(
        `League sync complete — ${apiLeagues.length} leagues processed`,
      );
    } catch (error) {
      this.logger.error(`League sync failed: ${(error as Error).message}`);
    }
  }

  /**
   * Seed featured leagues if the table is empty (called from module `onModuleInit`).
   */
  async seedIfEmpty(): Promise<void> {
    const count = await this.leagueRepo.count();
    if (count === 0) {
      this.logger.log('Leagues table empty — running initial sync');
      await this.syncLeagues();
    }
  }
}
