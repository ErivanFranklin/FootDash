import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { User } from '../users/user.entity';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockConfigService = {
  get: jest.fn((key: string, def?: any) => {
    const config: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      FRONTEND_URL: 'http://localhost:4200',
    };
    return config[key] ?? def;
  }),
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let userRepo: ReturnType<typeof mockUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    userRepo = module.get(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('throws when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(999, 'price_test'),
      ).rejects.toThrow('User not found');
    });

    it('creates a Stripe checkout session for an existing user with a customer ID', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_existing',
      };
      userRepo.findOne.mockResolvedValue(mockUser);

      // Mock Stripe instance inside the service
      const mockSession = { url: 'https://checkout.stripe.com/session/test' };
      const stripeCreate = jest.fn().mockResolvedValue(mockSession);
      (service as any).stripe = {
        customers: { create: jest.fn() },
        checkout: { sessions: { create: stripeCreate } },
      };

      const result = await service.createCheckoutSession(1, 'price_test_123');

      expect(stripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
          mode: 'subscription',
        }),
      );
      expect(result.url).toBe('https://checkout.stripe.com/session/test');
    });

    it('creates a new Stripe customer if none exists', async () => {
      const mockUser: Partial<User> = {
        id: 2,
        email: 'new@example.com',
        stripeCustomerId: undefined,
      };
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const mockCustomer = { id: 'cus_new_123' };
      const customerCreate = jest.fn().mockResolvedValue(mockCustomer);
      const sessionCreate = jest.fn().mockResolvedValue({ url: 'https://stripe.com/new' });
      (service as any).stripe = {
        customers: { create: customerCreate },
        checkout: { sessions: { create: sessionCreate } },
      };

      await service.createCheckoutSession(2, 'price_abc');

      expect(customerCreate).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stripeCustomerId: 'cus_new_123' }),
      );
    });
  });

  describe('handleWebhook', () => {
    it('throws when webhook secret is not configured', async () => {
      mockConfigService.get.mockReturnValueOnce(''); // STRIPE_WEBHOOK_SECRET missing/empty
      await expect(
        service.handleWebhook('sig', Buffer.from('payload')),
      ).rejects.toThrow('STRIPE_WEBHOOK_SECRET is not set');
    });

    it('throws when signature verification fails', async () => {
      const badSig = 'bad_signature';
      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Signature mismatch');
          }),
        },
      };

      await expect(
        service.handleWebhook(badSig, Buffer.from('payload')),
      ).rejects.toThrow('Webhook signature verification failed');
    });
  });
});
