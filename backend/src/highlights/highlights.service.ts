import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Highlight } from './entities/highlight.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HighlightsService {
  private readonly logger = new Logger(HighlightsService.name);
  private readonly youtubeApiKey: string | undefined;
  private readonly useMock: boolean;

  constructor(
    @InjectRepository(Highlight) private readonly repo: Repository<Highlight>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.youtubeApiKey = this.config.get<string>('YOUTUBE_API_KEY');
    this.useMock = !this.youtubeApiKey;
    if (this.useMock) {
      this.logger.warn('YOUTUBE_API_KEY not set — using mock highlights');
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Highlight[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      order: { matchDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findByMatch(matchId: number): Promise<Highlight[]> {
    return this.repo.find({
      where: { matchId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Highlight | null> {
    return this.repo.findOneBy({ id });
  }

  async incrementView(id: number): Promise<void> {
    await this.repo.increment({ id }, 'viewCount', 1);
  }

  async search(query: string): Promise<Highlight[]> {
    return this.repo
      .createQueryBuilder('h')
      .where(
        'LOWER(h.title) LIKE :q OR LOWER(h.homeTeam) LIKE :q OR LOWER(h.awayTeam) LIKE :q',
        {
          q: `%${query.toLowerCase()}%`,
        },
      )
      .orderBy('h.matchDate', 'DESC')
      .limit(30)
      .getMany();
  }

  // ── Sync from YouTube ────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncHighlights(): Promise<void> {
    if (this.useMock) {
      await this.seedMockIfEmpty();
      return;
    }
    this.logger.log('Syncing highlights from YouTube...');
    try {
      const videos = await this.fetchFromYouTube('football highlights');
      let imported = 0;
      for (const video of videos) {
        const existing = await this.repo.findOneBy({
          externalId: video.externalId,
        });
        if (!existing) {
          await this.repo.save(this.repo.create(video));
          imported++;
        }
      }
      this.logger.log(`Imported ${imported} new highlights`);
    } catch (err) {
      this.logger.error('Failed to sync highlights', (err as Error).message);
    }
  }

  private async fetchFromYouTube(query: string): Promise<Partial<Highlight>[]> {
    const url = 'https://www.googleapis.com/youtube/v3/search';
    const { data } = await firstValueFrom(
      this.http.get(url, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 25,
          order: 'date',
          key: this.youtubeApiKey,
        },
      }),
    );
    return (data.items || []).map((item: any) => ({
      externalId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube',
      matchId: 0,
    }));
  }

  // ── Mock Seed ────────────────────────────────────────────────────────────

  private async seedMockIfEmpty(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    const mocks: Partial<Highlight>[] = [
      {
        matchId: 1,
        title: 'Arsenal vs Chelsea 3-1 — All Goals & Highlights',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        thumbnailUrl: 'https://img.youtube.com/vi/mock1/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=mock1',
        source: 'youtube',
        externalId: 'mock-ars-che',
        duration: 620,
        matchDate: '2025-01-15',
      },
      {
        matchId: 2,
        title: 'Real Madrid vs Barcelona 2-2 — El Clásico',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        thumbnailUrl: 'https://img.youtube.com/vi/mock2/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=mock2',
        source: 'youtube',
        externalId: 'mock-rma-bar',
        duration: 720,
        matchDate: '2025-01-12',
      },
      {
        matchId: 3,
        title: 'Liverpool vs Man City 4-3 — Thriller at Anfield',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City',
        thumbnailUrl: 'https://img.youtube.com/vi/mock3/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=mock3',
        source: 'youtube',
        externalId: 'mock-liv-mci',
        duration: 830,
        matchDate: '2025-01-10',
      },
      {
        matchId: 4,
        title: 'Bayern Munich vs Dortmund 2-0 — Der Klassiker',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        thumbnailUrl: 'https://img.youtube.com/vi/mock4/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=mock4',
        source: 'youtube',
        externalId: 'mock-bay-bvb',
        duration: 540,
        matchDate: '2025-01-08',
      },
      {
        matchId: 5,
        title: 'PSG vs Marseille 1-1 — Le Classique',
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Olympique Marseille',
        thumbnailUrl: 'https://img.youtube.com/vi/mock5/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=mock5',
        source: 'youtube',
        externalId: 'mock-psg-om',
        duration: 480,
        matchDate: '2025-01-05',
      },
    ];

    for (const mock of mocks) {
      await this.repo.save(this.repo.create(mock));
    }
    this.logger.log('Seeded 5 mock highlights');
  }
}
