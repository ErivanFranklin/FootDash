import { Test, TestingModule } from '@nestjs/testing';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';

describe('LeagueController', () => {
  let controller: LeagueController;
  let service: LeagueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeagueController],
      providers: [
        {
          provide: LeagueService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([{ id: 1, name: 'All' }]),
            findFeatured: jest.fn().mockResolvedValue([{ id: 2, name: 'Featured' }]),
            findById: jest.fn().mockResolvedValue({ id: 3 }),
            getStandings: jest.fn().mockResolvedValue([{ rank: 1 }]),
            getFixtures: jest.fn().mockResolvedValue([{ id: 101 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<LeagueController>(LeagueController);
    service = module.get<LeagueService>(LeagueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLeagues', () => {
    it('should call findFeatured when featured parameter is true', async () => {
      const result = await controller.getLeagues('true');
      expect(service.findFeatured).toHaveBeenCalled();
      expect(result).toEqual([{ id: 2, name: 'Featured' }]);
    });

    it('should call findAll when featured parameter is not true', async () => {
      const result = await controller.getLeagues('false');
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, name: 'All' }]);
    });
  });

  describe('getLeague', () => {
    it('should call findById', async () => {
      const result = await controller.getLeague(3);
      expect(service.findById).toHaveBeenCalledWith(3);
      expect(result).toEqual({ id: 3 });
    });
  });

  describe('getStandings', () => {
      it('should call getStandings', async () => {
          const result = await controller.getStandings(1);
          expect(service.getStandings).toHaveBeenCalledWith(1);
          expect(result).toEqual([{ rank: 1 }]);
      });
  });

  describe('getFixtures', () => {
      it('should call getFixtures', async () => {
          const result = await controller.getFixtures(1, 'Round 1');
          expect(service.getFixtures).toHaveBeenCalledWith(1, 'Round 1');
          expect(result).toEqual([{ id: 101 }]);
      });
  });
});
