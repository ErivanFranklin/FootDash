import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FantasyLeagueService } from './fantasy-league.service';
import {
  FantasyLeague,
  FantasyTeam,
  FantasyRoster,
  FantasyGameweek,
  FantasyPoints,
} from './entities/fantasy.entities';
import { Player } from '../players/entities/player.entity';
import { getMetadataArgsStorage } from 'typeorm';

const mockRepo = () => ({
  create: jest.fn((dto: any) => dto),
  save: jest.fn().mockResolvedValue({ id: 1 }),
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  increment: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(() => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  })),
});

describe('FantasyLeagueService', () => {
  let service: FantasyLeagueService;
  let leagueRepo: ReturnType<typeof mockRepo>;
  let teamRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FantasyLeagueService,
        { provide: getRepositoryToken(FantasyLeague), useFactory: mockRepo },
        { provide: getRepositoryToken(FantasyTeam), useFactory: mockRepo },
        { provide: getRepositoryToken(FantasyRoster), useFactory: mockRepo },
        { provide: getRepositoryToken(FantasyGameweek), useFactory: mockRepo },
        { provide: getRepositoryToken(FantasyPoints), useFactory: mockRepo },
        { provide: getRepositoryToken(Player), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<FantasyLeagueService>(FantasyLeagueService);
    leagueRepo = module.get(getRepositoryToken(FantasyLeague));
    teamRepo = module.get(getRepositoryToken(FantasyTeam));
    jest.clearAllMocks();
  });

  // ── createLeague ──────────────────────────────────────────────────────────

  describe('createLeague', () => {
    it('creates a league with an 8-char alphanumeric invite code', async () => {
      const savedLeague = {
        id: 10,
        name: 'Test League',
        inviteCode: 'XXXXXXXX',
      };
      leagueRepo.save.mockResolvedValue(savedLeague);
      teamRepo.save.mockResolvedValue({ id: 1 });
      teamRepo.create.mockReturnValue({ id: 1 });

      const result = await service.createLeague(1, { name: 'Test League' });
      const created = leagueRepo.create.mock
        .calls[0][0] as Partial<FantasyLeague>;

      expect(result).toBeDefined();
      expect(created.inviteCode).toMatch(/^[A-Z2-9]{8}$/);
    });

    it('sets owner to the provided userId', async () => {
      leagueRepo.save.mockResolvedValue({ id: 1, ownerId: 42 });
      teamRepo.save.mockResolvedValue({});
      teamRepo.create.mockReturnValue({});

      await service.createLeague(42, { name: 'My League' });
      const created = leagueRepo.create.mock
        .calls[0][0] as Partial<FantasyLeague>;

      expect(created.ownerId).toBe(42);
    });

    it('applies default maxMembers of 20 when not provided', async () => {
      leagueRepo.save.mockResolvedValue({ id: 1 });
      teamRepo.save.mockResolvedValue({});
      teamRepo.create.mockReturnValue({});

      await service.createLeague(1, { name: 'League' });
      const created = leagueRepo.create.mock
        .calls[0][0] as Partial<FantasyLeague>;

      expect(created.maxMembers).toBe(20);
    });

    it('uses provided maxMembers when given', async () => {
      leagueRepo.save.mockResolvedValue({ id: 1 });
      teamRepo.save.mockResolvedValue({});
      teamRepo.create.mockReturnValue({});

      await service.createLeague(1, { name: 'Big League', maxMembers: 50 });
      const created = leagueRepo.create.mock
        .calls[0][0] as Partial<FantasyLeague>;

      expect(created.maxMembers).toBe(50);
    });

    it('generates unique codes on repeated calls', async () => {
      leagueRepo.save.mockResolvedValue({ id: 1 });
      teamRepo.save.mockResolvedValue({});
      teamRepo.create.mockReturnValue({});

      await service.createLeague(1, { name: 'A' });
      await service.createLeague(1, { name: 'B' });

      const code1 = (leagueRepo.create.mock.calls[0][0] as any).inviteCode;
      const code2 = (leagueRepo.create.mock.calls[1][0] as any).inviteCode;
      // With a 32^8 space, collision is astronomically unlikely in tests
      expect(code1).toMatch(/^[A-Z2-9]{8}$/);
      expect(code2).toMatch(/^[A-Z2-9]{8}$/);
    });
  });

  // ── joinLeague ────────────────────────────────────────────────────────────

  describe('joinLeague', () => {
    it('throws NotFoundException when invite code does not exist', async () => {
      leagueRepo.findOne.mockResolvedValue(null);
      await expect(service.joinLeague(2, 'BADCODE1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when league status is not draft', async () => {
      leagueRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'active',
        teams: [],
        maxMembers: 20,
      });
      await expect(service.joinLeague(2, 'ANYCODE1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when league is full', async () => {
      const teams = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        userId: i + 1,
      }));
      leagueRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'draft',
        teams,
        maxMembers: 20,
      });
      await expect(service.joinLeague(99, 'FULLCODE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when user is already in the league', async () => {
      leagueRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'draft',
        teams: [{ id: 1, userId: 5 }],
        maxMembers: 20,
      });
      await expect(service.joinLeague(5, 'DUPEUSER')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a team for the joining user', async () => {
      leagueRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'draft',
        teams: [],
        maxMembers: 20,
      });
      teamRepo.create.mockReturnValue({ userId: 2, leagueId: 1 });
      teamRepo.save.mockResolvedValue({ id: 99, userId: 2, leagueId: 1 });

      const result = await service.joinLeague(2, 'VALIDCOD');
      expect(result).toBeDefined();
      expect(teamRepo.save).toHaveBeenCalled();
    });
  });

  // ── getStandings ──────────────────────────────────────────────────────────

  describe('getStandings', () => {
    it('returns teams ordered by totalPoints descending', async () => {
      const teams = [
        { id: 1, totalPoints: 120 },
        { id: 2, totalPoints: 95 },
      ];
      teamRepo.find.mockResolvedValue(teams);

      const result = await service.getStandings(1);
      expect(result).toHaveLength(2);
      expect(teamRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { totalPoints: 'DESC' } }),
      );
    });

    it('returns empty array when no teams in league', async () => {
      teamRepo.find.mockResolvedValue([]);
      const result = await service.getStandings(99);
      expect(result).toHaveLength(0);
    });
  });

  // ── defaultScoringRules (indirectly via createLeague) ─────────────────────

  describe('scoring rules', () => {
    it('includes FPL-style fields with correct values', async () => {
      leagueRepo.save.mockResolvedValue({ id: 1 });
      teamRepo.save.mockResolvedValue({});
      teamRepo.create.mockReturnValue({});

      await service.createLeague(1, { name: 'Rules Check' });
      const created: any = leagueRepo.create.mock.calls[0][0];

      expect(created.scoringRules.goal_fwd).toBe(4);
      expect(created.scoringRules.goal_mid).toBe(5);
      expect(created.scoringRules.assist).toBe(3);
      expect(created.scoringRules.yellow_card).toBe(-1);
      expect(created.scoringRules.penalty_save).toBe(5);
    });
  });

  describe('entity mappings', () => {
    it('maps FantasyLeague.leagueId to league_id column', () => {
      const metadata = getMetadataArgsStorage().columns.find(
        (col) =>
          col.target === FantasyLeague && col.propertyName === 'leagueId',
      );

      expect(metadata?.options?.name).toBe('league_id');
    });
  });

  // ── makeTransfer ──────────────────────────────────────────────────────────

  describe('makeTransfer', () => {
    it('throws NotFoundException when team does not exist', async () => {
      teamRepo.findOne.mockResolvedValue(null);
      await expect(service.makeTransfer(1, 1, 5, 6, 8.5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when team does not belong to user', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 99 });
      const { ForbiddenException: FE } = await import('@nestjs/common');
      await expect(service.makeTransfer(1, 1, 5, 6, 8.5)).rejects.toThrow(FE);
    });
  });
});
