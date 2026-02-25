import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

import { FootballApiService } from './football-api.service';

describe('FootballApiService', () => {
  let service: FootballApiService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  function createService(overrides: Record<string, any> = {}) {
    const config: Record<string, any> = {
      FOOTBALL_API_KEY: 'test-key',
      FOOTBALL_API_URL: 'https://api.example.com',
      FOOTBALL_API_MOCK: false,
      ...overrides,
    };

    configService = {
      get: jest.fn((key: string, defaultVal?: any) => config[key] ?? defaultVal),
    } as any;

    httpService = {
      get: jest.fn(),
    } as any;

    service = new FootballApiService(httpService, configService);
  }

  beforeEach(() => {
    createService();
  });

  // --- isMockMode ---

  describe('isMockMode', () => {
    it('returns false when FOOTBALL_API_MOCK is false', () => {
      expect(service.isMockMode()).toBe(false);
    });

    it('returns true when FOOTBALL_API_MOCK is true', () => {
      createService({ FOOTBALL_API_MOCK: true });
      expect(service.isMockMode()).toBe(true);
    });
  });

  // --- Mock mode responses ---

  describe('mock mode', () => {
    beforeEach(() => {
      createService({ FOOTBALL_API_MOCK: true });
    });

    it('getTeamInfo returns mock data', async () => {
      const result = await service.getTeamInfo(33);
      expect(result).toBeDefined();
      expect((result as any).id).toBe(33);
      expect((result as any).name).toContain('Mock Team');
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('getTeamStats returns mock data', async () => {
      const result = await service.getTeamStats({ leagueId: 39, season: 2024, teamId: 33 });
      expect(result).toBeDefined();
      expect((result as any).fixtures?.played?.total).toBe(20);
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('getTeamFixtures returns mock data', async () => {
      const result = await service.getTeamFixtures({ teamId: 33, season: 2024 });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('getMatch returns mock data', async () => {
      const result = await service.getMatch(1001);
      expect(result).toBeDefined();
      expect((result as any).id).toBe(1001);
      expect((result as any).status).toBe('IN_PLAY');
      expect(httpService.get).not.toHaveBeenCalled();
    });
  });

  // --- makeRequest throws when not configured ---

  describe('when API is not configured', () => {
    beforeEach(() => {
      createService({ FOOTBALL_API_KEY: '', FOOTBALL_API_URL: '' });
    });

    it('getTeamInfo throws ServiceUnavailableException', async () => {
      await expect(service.getTeamInfo(33)).rejects.toThrow(ServiceUnavailableException);
    });

    it('getTeamFixtures throws ServiceUnavailableException', async () => {
      await expect(service.getTeamFixtures({ teamId: 33 })).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // --- HTTP error handling ---

  describe('HTTP error handling', () => {
    it('throws ServiceUnavailableException on API failure', async () => {
      httpService.get.mockReturnValue(throwError(() => ({ message: 'timeout', stack: '' })));
      await expect(service.getTeamInfo(33)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  // --- Free plan retry logic ---

  describe('getTeamFixtures free plan retry', () => {
    it('retries without last/next when plan error is returned', async () => {
      // First call returns plan error
      const planErrorResponse = mockAxiosResponse({
        errors: { plan: 'This endpoint requires a paid plan' },
        response: [],
      });
      // Second call (retry) returns success
      const successResponse = mockAxiosResponse({
        response: [
          {
            fixture: { id: 1, date: '2025-01-01', status: { short: 'FT', long: 'Full Time' } },
            teams: { home: { id: 33, name: 'Test' }, away: { id: 44, name: 'Rival' } },
            goals: { home: 2, away: 1 },
            league: { id: 39, name: 'League', country: 'UK', logo: '', season: 2024 },
          },
        ],
      });

      // Capture params snapshot on first call since the object gets mutated
      let firstCallParamsSnapshot: any;
      httpService.get
        .mockImplementationOnce((path: string, config: any) => {
          firstCallParamsSnapshot = { ...config?.params };
          return of(planErrorResponse) as any;
        })
        .mockReturnValueOnce(of(successResponse) as any);

      const result = await service.getTeamFixtures({ teamId: 33, season: 2024, last: 5 });

      expect(httpService.get).toHaveBeenCalledTimes(2);

      // First call should have included 'last' param
      expect(firstCallParamsSnapshot).toEqual(expect.objectContaining({ last: 5 }));

      // Second call (retry) should NOT include 'last' param
      const secondCallParams = httpService.get.mock.calls[1][1]?.params;
      expect(secondCallParams).not.toHaveProperty('last');
    });

    it('does NOT retry when there is no plan error', async () => {
      const successResponse = mockAxiosResponse({
        response: [],
      });
      httpService.get.mockReturnValue(of(successResponse) as any);

      await service.getTeamFixtures({ teamId: 33, season: 2024, last: 5 });

      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry when there is plan error but no last/next params', async () => {
      const planErrorResponse = mockAxiosResponse({
        errors: { plan: 'This endpoint requires a paid plan' },
        response: [],
      });
      httpService.get.mockReturnValue(of(planErrorResponse) as any);

      await service.getTeamFixtures({ teamId: 33, season: 2024 });

      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('retries without next param when plan error occurs', async () => {
      const planErrorResponse = mockAxiosResponse({
        errors: { plan: 'Upgrade plan' },
        response: [],
      });
      const successResponse = mockAxiosResponse({ response: [] });

      httpService.get
        .mockReturnValueOnce(of(planErrorResponse) as any)
        .mockReturnValueOnce(of(successResponse) as any);

      await service.getTeamFixtures({ teamId: 33, season: 2024, next: 10 });

      expect(httpService.get).toHaveBeenCalledTimes(2);
      const secondCallParams = httpService.get.mock.calls[1][1]?.params;
      expect(secondCallParams).not.toHaveProperty('next');
    });
  });

  // --- getMatch ---

  describe('getMatch', () => {
    it('returns single fixture from API', async () => {
      const apiResponse = mockAxiosResponse({
        response: [
          {
            fixture: { id: 555, date: '2025-02-25', status: { short: 'FT', long: 'Full Time' } },
            teams: { home: { id: 33, name: 'Home' }, away: { id: 44, name: 'Away' } },
            goals: { home: 1, away: 0 },
            league: { id: 39, name: 'Test League', country: 'UK', logo: '', season: 2024 },
          },
        ],
      });
      httpService.get.mockReturnValue(of(apiResponse) as any);

      const result = await service.getMatch(555);
      expect(result).toBeDefined();
      expect(httpService.get).toHaveBeenCalledWith('fixtures', { params: { id: 555 } });
    });

    it('returns null when no fixture found', async () => {
      const emptyResponse = mockAxiosResponse({ response: [] });
      httpService.get.mockReturnValue(of(emptyResponse) as any);

      const result = await service.getMatch(999);
      expect(result).toBeNull();
    });
  });

  // --- Query parameters ---

  describe('getTeamFixtures query params', () => {
    it('includes optional params when provided', async () => {
      const successResponse = mockAxiosResponse({ response: [] });
      httpService.get.mockReturnValue(of(successResponse) as any);

      await service.getTeamFixtures({
        teamId: 33,
        season: 2024,
        status: 'FT',
        from: '2025-01-01',
        to: '2025-06-30',
      });

      const params = httpService.get.mock.calls[0][1]?.params;
      expect(params).toEqual(expect.objectContaining({
        team: 33,
        season: 2024,
        status: 'FT',
        from: '2025-01-01',
        to: '2025-06-30',
      }));
    });
  });
});
