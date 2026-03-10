import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../teams/entities/team.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Match } from '../matches/entities/match.entity';
import {
  SearchQueryDto,
  SearchType,
  SearchResultItem,
  SearchResponse,
} from './dto/search-query.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  async search(dto: SearchQueryDto): Promise<SearchResponse> {
    const { q, type, page, limit } = dto;
    const pattern = `%${q}%`;
    const offset = (page - 1) * limit;

    let results: SearchResultItem[] = [];
    let total = 0;

    if (type === SearchType.ALL) {
      const [teams, users, matches] = await Promise.all([
        this.searchTeams(pattern, 0, limit),
        this.searchUsers(pattern, 0, limit),
        this.searchMatches(pattern, 0, limit),
      ]);

      // Merge and sort by score
      const merged = [...teams.items, ...users.items, ...matches.items].sort(
        (a, b) => b.score - a.score,
      );

      total = teams.total + users.total + matches.total;
      results = merged.slice(offset, offset + limit);
    } else if (type === SearchType.TEAMS) {
      const res = await this.searchTeams(pattern, offset, limit);
      results = res.items;
      total = res.total;
    } else if (type === SearchType.USERS) {
      const res = await this.searchUsers(pattern, offset, limit);
      results = res.items;
      total = res.total;
    } else if (type === SearchType.MATCHES) {
      const res = await this.searchMatches(pattern, offset, limit);
      results = res.items;
      total = res.total;
    }

    return { results, total, page, limit, query: q, type };
  }

  private async searchTeams(
    pattern: string,
    offset: number,
    limit: number,
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    try {
      const [teams, total] = await this.teamRepo
        .createQueryBuilder('team')
        .where('team.name ILIKE :pattern', { pattern })
        .orWhere('team.shortCode ILIKE :pattern', { pattern })
        .orderBy('team.name', 'ASC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      const items: SearchResultItem[] = teams.map((t) => ({
        id: t.id,
        type: 'team' as const,
        title: t.name,
        subtitle: t.shortCode ?? undefined,
        imageUrl: undefined,
        url: `/teams`,
        score: this.scoreMatch(t.name, pattern),
      }));

      return { items, total };
    } catch (err) {
      this.logger.warn(`Team search failed: ${err}`);
      return { items: [], total: 0 };
    }
  }

  private async searchUsers(
    pattern: string,
    offset: number,
    limit: number,
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    try {
      const [profiles, total] = await this.profileRepo
        .createQueryBuilder('profile')
        .leftJoinAndSelect('profile.user', 'user')
        .where('profile.displayName ILIKE :pattern', { pattern })
        .orWhere('profile.bio ILIKE :pattern', { pattern })
        .orWhere('user.email ILIKE :pattern', { pattern })
        .orderBy('profile.displayName', 'ASC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      const items: SearchResultItem[] = profiles.map((p) => ({
        id: p.user?.id ?? p.id,
        type: 'user' as const,
        title: p.displayName ?? 'User',
        subtitle: p.bio ?? undefined,
        imageUrl: p.avatarUrl ?? undefined,
        url: `/user-profile/${p.user?.id ?? p.id}`,
        score: this.scoreMatch(p.displayName ?? '', pattern),
      }));

      return { items, total };
    } catch (err) {
      this.logger.warn(`User search failed: ${err}`);
      return { items: [], total: 0 };
    }
  }

  private async searchMatches(
    pattern: string,
    offset: number,
    limit: number,
  ): Promise<{ items: SearchResultItem[]; total: number }> {
    try {
      const [matches, total] = await this.matchRepo
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.homeTeam', 'homeTeam')
        .leftJoinAndSelect('match.awayTeam', 'awayTeam')
        .where('homeTeam.name ILIKE :pattern', { pattern })
        .orWhere('awayTeam.name ILIKE :pattern', { pattern })
        .orWhere('match.referee ILIKE :pattern', { pattern })
        .orderBy('match.kickOff', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      const items: SearchResultItem[] = matches.map((m) => {
        const home = m.homeTeam?.name ?? 'TBD';
        const away = m.awayTeam?.name ?? 'TBD';
        const score =
          m.homeScore != null && m.awayScore != null
            ? `${m.homeScore} - ${m.awayScore}`
            : (m.status ?? 'Scheduled');
        return {
          id: m.id,
          type: 'match' as const,
          title: `${home} vs ${away}`,
          subtitle: `${score} · ${m.kickOff ? new Date(m.kickOff).toLocaleDateString() : 'TBD'}`,
          imageUrl: undefined,
          url: `/match/${m.id}`,
          score: this.scoreMatch(`${home} ${away}`, pattern),
        };
      });

      return { items, total };
    } catch (err) {
      this.logger.warn(`Match search failed: ${err}`);
      return { items: [], total: 0 };
    }
  }

  /** Simple relevance scoring — exact matches score higher */
  private scoreMatch(text: string, pattern: string): number {
    const query = pattern.replace(/%/g, '').toLowerCase();
    const lower = text.toLowerCase();
    if (lower === query) return 100;
    if (lower.startsWith(query)) return 80;
    if (lower.includes(query)) return 60;
    return 40;
  }
}
