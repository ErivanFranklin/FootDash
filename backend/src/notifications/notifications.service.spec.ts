import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationToken } from './notification-token.entity';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockTokenRepository: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FCM_PROJECT_ID') return 'test-project';
      if (key === 'FCM_CLIENT_EMAIL') return 'test@email.com';
      if (key === 'FCM_PRIVATE_KEY') return 'test-key';
      return null;
    }),
  };

  beforeEach(async () => {
    mockTokenRepository = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(NotificationToken),
          useValue: mockTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    it('should accept a valid token', async () => {
      const validToken = 'a'.repeat(51);
      const payload = { token: validToken, platform: 'web' };

      await service.registerToken(payload);

      expect(mockTokenRepository.upsert).toHaveBeenCalledWith(
        { token: validToken, platform: 'web', userId: undefined },
        ['token'],
      );
    });

    it('should reject a token that is too short', async () => {
      const shortToken = 'a'.repeat(49);
      const payload = { token: shortToken };

      await expect(service.registerToken(payload)).rejects.toThrow(
        new BadRequestException('token is too short or malformed'),
      );
    });

    it('should reject a null or empty token', async () => {
      await expect(service.registerToken({ token: '' } as any)).rejects.toThrow(
        new BadRequestException('token is required'),
      );
      // missing token property should also be rejected
      await expect(service.registerToken({} as any)).rejects.toThrow(
        new BadRequestException('token is required'),
      );
    });

    it('should trim whitespace from a token', async () => {
      const tokenWithWhitespace = '  ' + 'a'.repeat(51) + '  ';
      const trimmedToken = 'a'.repeat(51);
      const payload = { token: tokenWithWhitespace };

      await service.registerToken(payload);

      expect(mockTokenRepository.upsert).toHaveBeenCalledWith(
        { token: trimmedToken, platform: undefined, userId: undefined },
        ['token'],
      );
    });
  });

  describe('diagnostics and sendMatchNotice', () => {
    it('getTokenDiagnostics reports short tokens correctly', async () => {
      const sampleTokens = [
        { id: 1, token: 'a'.repeat(10) },
        { id: 2, token: 'b'.repeat(60) },
      ];
      mockTokenRepository.find = jest.fn().mockResolvedValue(sampleTokens);

      const diag = await service.getTokenDiagnostics();
      expect(diag.total).toBe(2);
      expect(diag.shortCount).toBe(1);
      expect(Array.isArray(diag.short)).toBe(true);
      expect(diag.short[0].id).toBe(1);
    });

    it('sendMatchNotice cleans up invalid tokens when response indicates invalid token', async () => {
      // Prepare tokens
      const tokens = [
        { id: 1, token: 'validtoken1' },
        { id: 2, token: 'invalidtoken' },
      ];
      mockTokenRepository.find = jest.fn().mockResolvedValue(tokens);
      mockTokenRepository.remove = jest.fn().mockResolvedValue(true);

      // Force service to consider messaging enabled and inject a fake messaging implementation
      (service as any).enabled = true;
      (service as any).debugEnabled = false;
      const fakeResponse = {
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: { message: 'Not registered', code: 'messaging/registration-token-not-registered' } },
        ],
      } as any;

      (service as any).messaging = {
        sendEachForMulticast: jest.fn().mockResolvedValue(fakeResponse),
      };

      // No webhook configured
      (mockConfigService.get as jest.Mock).mockReturnValueOnce(null);

      // Call sendMatchNotice
      const match = { id: 123, homeTeam: { name: 'Home' }, awayTeam: { name: 'Away' } } as any;
      await service.sendMatchNotice(match, 'result', 'Match ended');

      // Should remove the invalid token
      expect(mockTokenRepository.remove).toHaveBeenCalled();
    });
  });
});
