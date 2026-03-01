import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { FavoritesService } from '../favorites/favorites.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly favoritesService: FavoritesService,
  ) {}

  async getPersonalizedDashboard(userId: number) {
    const favoriteTeamIds = await this.favoritesService.getFavoriteTeamIds(userId);

    // Load favorite teams
    let favoriteTeams: Team[] = [];
    if (favoriteTeamIds.length > 0) {
      favoriteTeams = await this.teamRepo.find({
        where: { id: In(favoriteTeamIds) },
      });
    }

    // Recent results for favorite teams (last 5 finished)
    let recentResults: Match[] = [];
    if (favoriteTeamIds.length > 0) {
      const qb = this.matchRepo
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.homeTeam', 'homeTeam')
        .leftJoinAndSelect('match.awayTeam', 'awayTeam')
        .where(
          '(match.homeTeam.id IN (:...teamIds) OR match.awayTeam.id IN (:...teamIds))',
          { teamIds: favoriteTeamIds },
        )
        .andWhere("match.status IN ('FINISHED', 'FT')")
        .orderBy('match.kickOff', 'DESC')
        .take(5);

      recentResults = await qb.getMany();
    }

    // Upcoming matches for favorite teams
    let upcomingMatches: Match[] = [];
    if (favoriteTeamIds.length > 0) {
      const qb = this.matchRepo
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.homeTeam', 'homeTeam')
        .leftJoinAndSelect('match.awayTeam', 'awayTeam')
        .where(
          '(match.homeTeam.id IN (:...teamIds) OR match.awayTeam.id IN (:...teamIds))',
          { teamIds: favoriteTeamIds },
        )
        .andWhere("match.status NOT IN ('FINISHED', 'FT')")
        .orderBy('match.kickOff', 'ASC')
        .take(5);

      upcomingMatches = await qb.getMany();
    }

    // All recent matches (for non-personalized fallback)
    const allRecentMatches = await this.matchRepo.find({
      relations: ['homeTeam', 'awayTeam'],
      order: { kickOff: 'DESC' },
      take: 10,
    });

    return {
      favoriteTeams,
      recentResults,
      upcomingMatches,
      allRecentMatches,
      hasFavorites: favoriteTeamIds.length > 0,
    };
  }
}
