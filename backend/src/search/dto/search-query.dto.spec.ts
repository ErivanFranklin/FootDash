import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { SearchQueryDto, SearchType } from './search-query.dto';

describe('SearchQueryDto', () => {
  it('trims query and validates a minimal valid payload', () => {
    const dto = plainToInstance(SearchQueryDto, {
      q: '  arsenal  ',
      type: SearchType.TEAMS,
      page: '2',
      limit: '10',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBe(0);
    expect(dto.q).toBe('arsenal');
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('fails when query is too short', () => {
    const dto = plainToInstance(SearchQueryDto, {
      q: 'a',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'q')).toBe(true);
  });

  it('fails when type is unsupported', () => {
    const dto = plainToInstance(SearchQueryDto, {
      q: 'valid',
      type: 'invalid',
    });

    const errors = validateSync(dto);

    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('fails when page/limit are outside allowed range', () => {
    const dto = plainToInstance(SearchQueryDto, {
      q: 'valid',
      page: 0,
      limit: 100,
    });

    const errors = validateSync(dto);

    expect(errors.some((e) => e.property === 'page')).toBe(true);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });
});