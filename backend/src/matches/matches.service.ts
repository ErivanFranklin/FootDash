import { Injectable } from '@nestjs/common';
import { FootballApiService } from '../football-api/football-api.service';
import { MatchesQueryDto, MatchRangeType } from './dto/matches-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { MatchGateway } from '../websockets/match.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly footballApi: FootballApiService,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly matchGateway: MatchGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getMatch(id: number) {
    return this.matchRepository.findOne({
      where: { id },
      relations: ['homeTeam', 'awayTeam'],
    });
  }

  getTeamMatches(teamId: number, query: MatchesQueryDto) {
    const { range, limit, season, from, to } = query;

    const request: any = {
      teamId,
      season,
      last: range === MatchRangeType.RECENT ? (limit ?? 5) : undefined,
      next: range === MatchRangeType.UPCOMING ? (limit ?? 5) : undefined,
    };
    if (from) request.from = from;
    if (to) request.to = to;

    return this.footballApi.getTeamFixtures(request);
  }

  /**
   * Fetch fixtures from Football API and persist teams and matches into DB.
   */
  async syncFixturesFromApi(teamId: number, query: MatchesQueryDto) {
    const fixtures = (await this.getTeamMatches(
      teamId,
      query,
    )) as unknown as any[];

    const savedMatches: Match[] = [];

    for (const f of fixtures || []) {
      const externalMatchId = f?.id ?? f?.fixture?.id;

      // home/away team data
      const homeApi = f?.home ?? f?.teams?.home ?? f?.teams?.home;
      const awayApi = f?.away ?? f?.teams?.away ?? f?.teams?.away;

      const homeExternalId = homeApi?.id ?? homeApi?.team?.id;
      const awayExternalId = awayApi?.id ?? awayApi?.team?.id;

      // Upsert home team
      let home = await this.teamRepository.findOne({
        where: { externalId: homeExternalId },
      });
      if (!home) {
        home = this.teamRepository.create({
          externalId: homeExternalId,
          name: homeApi?.name ?? homeApi?.team?.name,
        });
        home = await this.teamRepository.save(home);
      }

      // Upsert away team
      let away = await this.teamRepository.findOne({
        where: { externalId: awayExternalId },
      });
      if (!away) {
        away = this.teamRepository.create({
          externalId: awayExternalId,
          name: awayApi?.name ?? awayApi?.team?.name,
        });
        away = await this.teamRepository.save(away);
      }

      // Upsert match
      let existing = externalMatchId
        ? await this.matchRepository.findOne({
            where: { externalId: externalMatchId },
          })
        : undefined;

      // Normalized adapter provides consistent fields when available
      const kickOffRaw =
        f?.date ?? f?.fixture?.date ?? f?.kickoff ?? f?.utcDate;
      const kickOff = kickOffRaw ? new Date(kickOffRaw) : undefined;
      const status =
        (f as any)?.status?.short ??
        (f as any)?.status ??
        (f as any)?.status?.long ??
        null;
      const homeScore =
        (f as any)?.goals?.home ?? (f as any)?.score?.fulltime?.home ?? null;
      const awayScore =
        (f as any)?.goals?.away ?? (f as any)?.score?.fulltime?.away ?? null;
      const referee = (f as any)?.referee ?? null;
      const venue = (f as any)?.venue ?? null;

      if (existing) {
        const prevStatus = existing.status;
        const prevHomeScore = existing.homeScore;
        const prevAwayScore = existing.awayScore;

        existing.kickOff = kickOff;
        existing.status = status;
        existing.homeScore = homeScore;
        existing.awayScore = awayScore;
        existing.referee = referee;
        existing.venue = venue;
        existing.homeTeam = home;
        existing.awayTeam = away;
        existing = await this.matchRepository.save(existing);

        const goalSummary = this.buildGoalEvent(
          home,
          away,
          prevHomeScore,
          prevAwayScore,
          existing.homeScore,
          existing.awayScore,
        );
        const statusStarted = this.didStatusTransitionToLive(prevStatus, existing.status);
        const statusFinished = this.didStatusTransitionToFinished(prevStatus, existing.status);
        this.broadcastMatchUpdate(existing);
        if (statusStarted) {
          void this.notificationsService.sendMatchNotice(
            existing,
            'match-start',
            `${home.name} vs ${away.name} is live now!`,
          );
        }
        if (goalSummary) {
          void this.notificationsService.sendMatchNotice(existing, 'goal', goalSummary);
        }
        if (statusFinished) {
          void this.notificationsService.sendMatchNotice(
            existing,
            'result',
            `${home.name} ${existing.homeScore ?? 0} - ${existing.awayScore ?? 0} ${away.name} (FT)`,
          );
        }
        savedMatches.push(existing);
        continue;
      }

      const newMatch = this.matchRepository.create({
        externalId: externalMatchId,
        homeTeam: home,
        awayTeam: away,
      });

      const saved = await this.matchRepository.save(newMatch);
      this.matchGateway.broadcastMatchUpdate(String(saved.id), saved);
      savedMatches.push(saved);
    }

    return savedMatches;
  }

  private broadcastMatchUpdate(match: Match) {
    this.matchGateway.broadcastMatchUpdate(String(match.id), match);
  }

  private buildGoalEvent(
    home: Team,
    away: Team,
    currentHomeScore: number | null | undefined,
    currentAwayScore: number | null | undefined,
    incomingHomeScore: number | null | undefined,
    incomingAwayScore: number | null | undefined,
  ) {
    const prevHome = currentHomeScore ?? 0;
    const prevAway = currentAwayScore ?? 0;
    const newHome = incomingHomeScore ?? prevHome;
    const newAway = incomingAwayScore ?? prevAway;
    if (newHome > prevHome) {
      return `${home.name} scored! ${newHome}-${newAway}`;
    }
    if (newAway > prevAway) {
      return `${away.name} scored! ${newHome}-${newAway}`;
    }
    return undefined;
  }

  private normalizeStatus(status?: string) {
    return status?.toLowerCase().replace(/\s+/g, '') ?? '';
  }

  private didStatusTransitionToLive(previous?: string, next?: string) {
    const liveStatuses = new Set(['inplay', 'live', 'active', 'playing']);
    const prev = this.normalizeStatus(previous);
    const curr = this.normalizeStatus(next);
    return liveStatuses.has(curr) && !liveStatuses.has(prev);
  }

  private didStatusTransitionToFinished(previous?: string, next?: string) {
    const finished = new Set(['finished', 'fulltime', 'ft', 'completed']);
    const prev = this.normalizeStatus(previous);
    const curr = this.normalizeStatus(next);
    return finished.has(curr) && !finished.has(prev);
  }
}
