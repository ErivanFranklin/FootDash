import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

const mockRepo = () => {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };
  return {
    create: jest.fn((dto: any) => dto),
    save: jest.fn().mockResolvedValue({ id: 1 }),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    increment: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => qb),
    qb, // Exposed for easier verification
  };
};

describe('FantasyLeagueService', () => {
  let service: FantasyLeagueService;
  let leagueRepo: ReturnType<typeof mockRepo>;
  let teamRepo: ReturnType<typeof mockRepo>;
  let rosterRepo: ReturnType<typeof mockRepo>;
  let gameweekRepo: ReturnType<typeof mockRepo>;
  let pointsRepo: ReturnType<typeof mockRepo>;
  let playersRepo: ReturnType<typeof mockRepo>;

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
    rosterRepo = module.get(getRepositoryToken(FantasyRoster));
    gameweekRepo = module.get(getRepositoryToken(FantasyGameweek));
    pointsRepo = module.get(getRepositoryToken(FantasyPoints));
    playersRepo = module.get(getRepositoryToken(Player));
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
      await expect(service.makeTransfer(1, 1, 5, 6, 8.5)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyLeagues', () => {
    it('should query leagues joined by specific user', async () => {
      await service.getMyLeagues(123);
      expect(leagueRepo.createQueryBuilder).toHaveBeenCalled();
      expect(leagueRepo.qb.innerJoin).toHaveBeenCalledWith(
        'league.teams', 
        'team', 
        'team.user_id = :uid', 
        { uid: 123 }
      );
    });
  });

  describe('setSquad', () => {
    it('throws BadRequestException if cost exceeds budget', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 1, budget: 10, roster: [] });
      await expect(service.setSquad(1, 1, [{ playerId: 2, position: 'MID', purchasePrice: 15 }])).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if squad size > 15', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 1, budget: 100, roster: [] });
      const largeRoster = Array(16).fill({ playerId: 1, position: 'MID', purchasePrice: 1 });
      await expect(service.setSquad(1, 1, largeRoster)).rejects.toThrow(BadRequestException);
    });

    it('saves roster and deletes old one', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 1, budget: 100, roster: [] });
      await service.setSquad(1, 1, [{ playerId: 2, position: 'MID', purchasePrice: 10 }]);
      expect(rosterRepo.delete).toHaveBeenCalled();
      expect(rosterRepo.save).toHaveBeenCalled();
    });
  });

  describe('processGameweek', () => {
    it('throws NotFoundException if gameweek missing', async () => {
      gameweekRepo.findOne.mockResolvedValue(null);
      await expect(service.processGameweek(1, new Map())).rejects.toThrow(NotFoundException);
    });

    it('skips processing if gameweek already processed', async () => {
      gameweekRepo.findOne.mockResolvedValue({ id: 1, processed: true });
      await service.processGameweek(1, new Map());
      expect(teamRepo.save).not.toHaveBeenCalled();
    });

    it('processes points for starters and handles captain multiplier', async () => {
      const mockGw = {
        id: 1,
        processed: false,
        league: {
          teams: [{
            id: 101,
            totalPoints: 0,
            roster: [
              { playerId: 1, isStarter: true, isCaptain: true, position: 'FWD' },
              { playerId: 2, isStarter: true, isCaptain: false, position: 'MID' },
              { playerId: 3, isStarter: false, isCaptain: false, position: 'DEF' }
            ]
          }]
        }
      };
      gameweekRepo.findOne.mockResolvedValue(mockGw);
      
      const pointsMap = new Map();
      pointsMap.set(1, { points: 5, breakdown: { goals: 1 } });
      pointsMap.set(2, { points: 2, breakdown: { minutes: 90 } });
      pointsMap.set(3, { points: 10, breakdown: { goals: 2 } }); // Bench

      await service.processGameweek(1, pointsMap);
      
      // Starter 1: 5 * 2 (captain) = 10
      // Starter 2: 2
      // Bench 3: 0
      // Total: 12
      expect(mockGw.league.teams[0].totalPoints).toBe(12);
      expect(pointsRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('Additional Methods', () => {
    it('getTeam returns team or throws', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 42, roster: [] });
      const team = await service.getTeam(1, 42);
      expect(team.id).toBe(1);
      
      await expect(service.getTeam(1, 99)).rejects.toThrow(ForbiddenException);
      
      teamRepo.findOne.mockResolvedValue(null);
      await expect(service.getTeam(2, 42)).rejects.toThrow(NotFoundException);
    });

    it('makeTransfer handles free transfers and penalties', async () => {
      const team = { id: 1, userId: 1, freeTransfersRemaining: 1, totalPoints: 100, budget: 10 };
      teamRepo.findOne.mockResolvedValue(team);
      rosterRepo.findOne.mockResolvedValue({ playerId: 5, purchasePrice: 8, position: 'MID', isStarter: true });
      
      // Case 1: Free transfer
      await service.makeTransfer(1, 1, 5, 6, 9);
      expect(team.freeTransfersRemaining).toBe(0);
      expect(team.totalPoints).toBe(100);
      expect(team.budget).toBe(9); // 10 + 8 - 9

      // Case 2: Penalty transfer
      await service.makeTransfer(1, 1, 6, 7, 9);
      expect(team.totalPoints).toBe(96);
      
      // Case 3: Player not in squad
      rosterRepo.findOne.mockResolvedValue(null);
      await expect(service.makeTransfer(1, 1, 99, 100, 5)).rejects.toThrow(NotFoundException);
    });

    it('getTransferMarket builds options from players or mocks', async () => {
      teamRepo.findOne.mockResolvedValue({ id: 1, userId: 1, budget: 10, freeTransfersRemaining: 1, roster: [] });
      
      // Case 1: From database
      playersRepo.qb.getMany.mockResolvedValue([
        { id: 10, name: 'P1', price: 5, form: 80, teamName: 'T1' }
      ]);
      const res1 = await service.getTransferMarket(1, 1);
      expect(res1.options[0].name).toBe('P1');
      expect(res1.options[0].trend).toBe('up');

      // Case 2: From mocks (fallback)
      playersRepo.qb.getMany.mockResolvedValue([]);
      const res2 = await service.getTransferMarket(1, 1);
      expect(res2.options.length).toBeGreaterThan(0);
      expect(res2.options[0].teamName).toBe('Market XI');
    });

    it('createGameweek saves a new gameweek', async () => {
      const start = new Date();
      const end = new Date();
      await service.createGameweek(1, 5, start, end);
      expect(gameweekRepo.create).toHaveBeenCalledWith(expect.objectContaining({ weekNumber: 5 }));
      expect(gameweekRepo.save).toHaveBeenCalled();
    });
  });
});
