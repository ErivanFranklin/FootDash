import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FantasyLeague,
  FantasyTeam,
  FantasyRoster,
  FantasyGameweek,
  FantasyPoints,
} from './entities/fantasy.entities';
import { Player } from '../players/entities/player.entity';

type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface TransferMarketOption {
  playerId: number;
  name: string;
  position: PlayerPosition;
  teamName?: string;
  price: number;
  form: number;
  trend: 'up' | 'down' | 'flat';
}

export interface TransferMarketResponse {
  teamId: number;
  budget: number;
  freeTransfersRemaining: number;
  outgoingPlayerId?: number;
  outgoingPosition?: PlayerPosition;
  options: TransferMarketOption[];
}

@Injectable()
export class FantasyLeagueService {
  private readonly logger = new Logger(FantasyLeagueService.name);

  constructor(
    @InjectRepository(FantasyLeague)
    private readonly leagueRepo: Repository<FantasyLeague>,
    @InjectRepository(FantasyTeam)
    private readonly teamRepo: Repository<FantasyTeam>,
    @InjectRepository(FantasyRoster)
    private readonly rosterRepo: Repository<FantasyRoster>,
    @InjectRepository(FantasyGameweek)
    private readonly gameweekRepo: Repository<FantasyGameweek>,
    @InjectRepository(FantasyPoints)
    private readonly pointsRepo: Repository<FantasyPoints>,
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  async createLeague(ownerId: number, dto: { name: string; maxMembers?: number; season?: string; leagueId?: number }): Promise<FantasyLeague> {
    const inviteCode = this.generateInviteCode();
    const league = this.leagueRepo.create({
      name: dto.name,
      ownerId,
      inviteCode,
      maxMembers: dto.maxMembers ?? 20,
      season: dto.season ?? new Date().getFullYear().toString(),
      leagueId: dto.leagueId ?? 39,
      status: 'draft',
      scoringRules: this.defaultScoringRules(),
    });
    const saved = await this.leagueRepo.save(league);

    await this.createTeam(ownerId, saved.id, `${dto.name} FC`);
    this.logger.log(`Fantasy league "${dto.name}" created by user ${ownerId} (code: ${inviteCode})`);
    return saved;
  }

  async joinLeague(userId: number, inviteCode: string): Promise<FantasyTeam> {
    const league = await this.leagueRepo.findOne({ where: { inviteCode }, relations: ['teams'] });
    if (!league) throw new NotFoundException('League not found');
    if (league.status !== 'draft') throw new BadRequestException('League is no longer accepting new members');
    if (league.teams.length >= league.maxMembers) throw new BadRequestException('League is full');
    if (league.teams.some((t) => t.userId === userId)) throw new BadRequestException('Already in this league');

    return this.createTeam(userId, league.id, `Team ${league.teams.length + 1}`);
  }

  async getMyLeagues(userId: number): Promise<FantasyLeague[]> {
    return this.leagueRepo
      .createQueryBuilder('league')
      .innerJoin('league.teams', 'team', 'team.user_id = :uid', { uid: userId })
      .getMany();
  }

  async getLeague(id: number): Promise<FantasyLeague> {
    const league = await this.leagueRepo.findOne({ where: { id }, relations: ['teams', 'teams.user', 'gameweeks'] });
    if (!league) throw new NotFoundException('League not found');
    return league;
  }

  async getStandings(leagueId: number): Promise<FantasyTeam[]> {
    return this.teamRepo.find({
      where: { leagueId },
      relations: ['user'],
      order: { totalPoints: 'DESC' },
    });
  }

  private async createTeam(userId: number, leagueId: number, name: string): Promise<FantasyTeam> {
    const team = this.teamRepo.create({ userId, leagueId, name, budget: 100, totalPoints: 0 });
    return this.teamRepo.save(team);
  }

  async getTeam(teamId: number, userId: number): Promise<FantasyTeam> {
    const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: ['roster'] });
    if (!team) throw new NotFoundException('Team not found');
    if (team.userId !== userId) throw new ForbiddenException('Not your team');
    return team;
  }

  async getTransferMarket(
    teamId: number,
    userId: number,
    outgoingPlayerId?: number,
  ): Promise<TransferMarketResponse> {
    const team = await this.getTeam(teamId, userId);
    const roster = team.roster ?? [];

    const outgoing = outgoingPlayerId
      ? roster.find((r) => r.playerId === outgoingPlayerId)
      : undefined;
    const position: PlayerPosition =
      (outgoing?.position as PlayerPosition) || 'MID';

    const excluded = new Set<number>(roster.map((r) => r.playerId));
    const options = await this.buildMarketOptionsFromPlayers(
      position,
      Number(team.budget),
      excluded,
      teamId,
    );

    return {
      teamId,
      budget: Number(team.budget),
      freeTransfersRemaining: team.freeTransfersRemaining,
      outgoingPlayerId: outgoing?.playerId,
      outgoingPosition: outgoing?.position as PlayerPosition | undefined,
      options,
    };
  }

  async setSquad(teamId: number, userId: number, roster: { playerId: number; position: string; purchasePrice: number; isCaptain?: boolean; isViceCaptain?: boolean }[]): Promise<FantasyRoster[]> {
    const team = await this.getTeam(teamId, userId);

    const totalCost = roster.reduce((sum, r) => sum + r.purchasePrice, 0);
    if (totalCost > team.budget) throw new BadRequestException(`Total cost (${totalCost}M) exceeds budget (${team.budget}M)`);

    if (roster.length > 15) throw new BadRequestException('Squad cannot exceed 15 players');

    await this.rosterRepo.delete({ fantasyTeamId: teamId });

    const entries = roster.map((r, idx) =>
      this.rosterRepo.create({
        fantasyTeamId: teamId,
        playerId: r.playerId,
        position: r.position as any,
        purchasePrice: r.purchasePrice,
        isCaptain: r.isCaptain ?? false,
        isViceCaptain: r.isViceCaptain ?? false,
        isStarter: idx < 11,
      }),
    );
    return this.rosterRepo.save(entries);
  }

  async makeTransfer(teamId: number, userId: number, outPlayerId: number, inPlayerId: number, inPrice: number): Promise<void> {
    const team = await this.getTeam(teamId, userId);

    if (team.freeTransfersRemaining <= 0) {
      team.totalPoints -= 4;
    } else {
      team.freeTransfersRemaining -= 1;
    }

    const outRoster = await this.rosterRepo.findOne({ where: { fantasyTeamId: teamId, playerId: outPlayerId } });
    if (!outRoster) throw new NotFoundException('Player not in squad');

    const refund = outRoster.purchasePrice;
    await this.rosterRepo.remove(outRoster);

    const incoming = this.rosterRepo.create({
      fantasyTeamId: teamId,
      playerId: inPlayerId,
      position: outRoster.position,
      purchasePrice: inPrice,
      isStarter: outRoster.isStarter,
    });
    await this.rosterRepo.save(incoming);

    team.budget = Number(team.budget) + Number(refund) - Number(inPrice);
    await this.teamRepo.save(team);
  }

  private buildMockMarketOptions(
    teamId: number,
    position: PlayerPosition,
    budget: number,
    excludedIds: Set<number>,
  ): TransferMarketOption[] {
    const base = 900000 + teamId * 100;
    const options: TransferMarketOption[] = [];
    const templates = [
      { name: 'Rising Star', delta: -1.5, trend: 'up' as const, form: 82 },
      { name: 'Safe Pick', delta: -0.2, trend: 'flat' as const, form: 74 },
      { name: 'Differential', delta: 1.1, trend: 'up' as const, form: 79 },
      { name: 'Value Choice', delta: -2.1, trend: 'flat' as const, form: 70 },
      { name: 'Premium Pick', delta: 2.3, trend: 'down' as const, form: 76 },
      { name: 'In-Form Option', delta: 0.5, trend: 'up' as const, form: 85 },
    ];

    for (let i = 0; i < templates.length; i += 1) {
      const id = base + i + 1;
      if (excludedIds.has(id)) continue;

      const price = Number(Math.max(4.0, Math.min(15.0, budget / 12 + templates[i].delta)).toFixed(1));
      options.push({
        playerId: id,
        name: `${position}-${id} ${templates[i].name}`,
        position,
        teamName: 'Market XI',
        price,
        form: templates[i].form,
        trend: templates[i].trend,
      });
    }

    return options;
  }

  private async buildMarketOptionsFromPlayers(
    position: PlayerPosition,
    budget: number,
    excludedIds: Set<number>,
    teamId: number,
  ): Promise<TransferMarketOption[]> {
    const maxAffordable = Math.max(4, budget + 1.5);
    const players = await this.playersRepo
      .createQueryBuilder('p')
      .where('p.is_active = true')
      .andWhere('p.position = :position', { position })
      .andWhere('p.price <= :maxAffordable', { maxAffordable })
      .orderBy('p.form', 'DESC')
      .addOrderBy('p.price', 'ASC')
      .take(20)
      .getMany();

    const fromTable = players
      .filter((p) => !excludedIds.has(p.id))
      .slice(0, 8)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        position,
        teamName: p.teamName,
        price: Number(p.price),
        form: p.form,
        trend: p.form >= 78 ? ('up' as const) : p.form <= 64 ? ('down' as const) : ('flat' as const),
      }));

    if (fromTable.length > 0) {
      return fromTable;
    }

    return this.buildMockMarketOptions(teamId, position, budget, excludedIds);
  }

  async createGameweek(leagueId: number, weekNumber: number, startDate: Date, endDate: Date): Promise<FantasyGameweek> {
    const gw = this.gameweekRepo.create({ leagueId, weekNumber, startDate, endDate, status: 'upcoming' });
    return this.gameweekRepo.save(gw);
  }

  async processGameweek(gameweekId: number, playerPointsMap: Map<number, { points: number; breakdown: Record<string, number> }>): Promise<void> {
    const gameweek = await this.gameweekRepo.findOne({ where: { id: gameweekId }, relations: ['league', 'league.teams', 'league.teams.roster'] });
    if (!gameweek) throw new NotFoundException('Gameweek not found');
    if (gameweek.processed) return;

    for (const team of gameweek.league.teams) {
      let teamGwPoints = 0;

      for (const rosterEntry of team.roster) {
        const playerData = playerPointsMap.get(rosterEntry.playerId);
        if (!playerData || !rosterEntry.isStarter) continue;

        let pts = playerData.points;
        if (rosterEntry.isCaptain) pts *= 2;

        teamGwPoints += pts;

        const fp = this.pointsRepo.create({
          fantasyTeamId: team.id,
          playerId: rosterEntry.playerId,
          gameweekId,
          points: pts,
          breakdown: playerData.breakdown,
        });
        await this.pointsRepo.save(fp);
      }

      team.totalPoints += teamGwPoints;
      await this.teamRepo.save(team);
    }

    gameweek.processed = true;
    gameweek.status = 'completed';
    await this.gameweekRepo.save(gameweek);

    await this.teamRepo
      .createQueryBuilder()
      .update(FantasyTeam)
      .set({ freeTransfersRemaining: 2 })
      .where('league_id = :lid', { lid: gameweek.leagueId })
      .execute();

    this.logger.log(`Gameweek ${gameweekId} processed (league ${gameweek.leagueId})`);
  }

  async getGameweekResults(gameweekId: number): Promise<FantasyPoints[]> {
    return this.pointsRepo.find({
      where: { gameweekId },
      relations: ['fantasyTeam', 'fantasyTeam.user'],
      order: { points: 'DESC' },
    });
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private defaultScoringRules(): Record<string, number> {
    return {
      playing_60_plus: 2,
      goal_fwd: 4,
      goal_mid: 5,
      goal_def_gk: 6,
      assist: 3,
      clean_sheet_def_gk: 4,
      clean_sheet_mid: 1,
      yellow_card: -1,
      red_card: -3,
      own_goal: -2,
      penalty_save: 5,
      penalty_miss: -2,
    };
  }
}
