import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';

describe('SearchController', () => {
  let controller: SearchController;

  const mockSearchService = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates search query to SearchService', async () => {
    const query: SearchQueryDto = {
      q: 'arsenal',
      type: SearchType.TEAMS,
      page: 1,
      limit: 20,
    };

    const expected = {
      results: [
        {
          id: 1,
          type: 'team' as const,
          title: 'Arsenal',
          url: '/teams',
          score: 100,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      query: 'arsenal',
      type: SearchType.TEAMS,
    };

    mockSearchService.search.mockResolvedValue(expected);

    const result = await controller.search(query);

    expect(result).toEqual(expected);
    expect(mockSearchService.search).toHaveBeenCalledWith(query);
  });
});
