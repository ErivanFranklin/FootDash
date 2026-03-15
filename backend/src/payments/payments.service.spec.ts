import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { User } from '../users/user.entity';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
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
      const sessionCreate = jest
        .fn()
        .mockResolvedValue({ url: 'https://stripe.com/new' });
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

    it('fulfills completed checkout sessions', async () => {
      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue({
            type: 'checkout.session.completed',
            data: {
              object: {
                metadata: { userId: '7' },
              },
            },
          }),
        },
      };

      await expect(
        service.handleWebhook('sig', Buffer.from('payload')),
      ).resolves.toEqual({ received: true });
      expect(userRepo.update).toHaveBeenCalledWith('7', { isPro: true });
    });

    it('downgrades users on subscription deletion webhooks', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 8,
        stripeCustomerId: 'cus_del',
        isPro: true,
      });
      userRepo.save.mockResolvedValue({ id: 8, isPro: false });
      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue({
            type: 'customer.subscription.deleted',
            data: {
              object: {
                customer: 'cus_del',
              },
            },
          }),
        },
      };

      await service.handleWebhook('sig', Buffer.from('payload'));

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_del' },
      });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 8, isPro: false }),
      );
    });
  });

  describe('getSubscriptionInfo', () => {
    it('throws when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getSubscriptionInfo(404)).rejects.toThrow(
        'User not found',
      );
    });

    it('returns free/none when user has no stripe customer', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        isPro: false,
        stripeCustomerId: null,
      });

      const result = await service.getSubscriptionInfo(1);
      expect(result.tier).toBe('free');
      expect(result.status).toBe('none');
    });

    it('returns active subscription details when stripe subscription exists', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        isPro: true,
        stripeCustomerId: 'cus_123',
      });
      (service as any).stripe = {
        subscriptions: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                status: 'active',
                current_period_end: 1_800_000_000,
                cancel_at_period_end: false,
              },
            ],
          }),
        },
      };

      const result = await service.getSubscriptionInfo(1);
      expect(result.tier).toBe('pro');
      expect(result.status).toBe('active');
      expect(result.stripeCustomerId).toBe('cus_123');
    });

    it('falls back to user tier when stripe has no active subscription record', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 2,
        isPro: true,
        stripeCustomerId: 'cus_456',
      });
      (service as any).stripe = {
        subscriptions: {
          list: jest.fn().mockResolvedValue({ data: [] }),
        },
      };

      const result = await service.getSubscriptionInfo(2);

      expect(result).toEqual({
        tier: 'pro',
        status: 'active',
        stripeCustomerId: 'cus_456',
      });
    });

    it('maps past due subscriptions correctly', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 3,
        isPro: true,
        stripeCustomerId: 'cus_789',
      });
      (service as any).stripe = {
        subscriptions: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                status: 'past_due',
                current_period_end: 1_800_000_000,
                cancel_at_period_end: true,
              },
            ],
          }),
        },
      };

      const result = await service.getSubscriptionInfo(3);

      expect(result.status).toBe('past_due');
      expect(result.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('getPaymentHistory', () => {
    it('throws when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getPaymentHistory(404)).rejects.toThrow(
        'User not found',
      );
    });

    it('returns empty history when user has no stripe customer', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1, stripeCustomerId: null });

      const result = await service.getPaymentHistory(1);
      expect(result).toEqual([]);
    });

    it('maps invoice history with fallback amount and description fields', async () => {
      userRepo.findOne.mockResolvedValue({ id: 2, stripeCustomerId: 'cus_42' });
      (service as any).stripe = {
        invoices: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'in_1',
                amount_paid: 0,
                amount_due: 1200,
                total: 1500,
                currency: 'usd',
                status: 'paid',
                created: 1_800_000_000,
                description: '',
                lines: { data: [{ description: 'Monthly Pro' }] },
              },
            ],
          }),
        },
      };

      const result = await service.getPaymentHistory(2);

      expect(result).toEqual([
        expect.objectContaining({
          id: 'in_1',
          amount: 1200,
          description: 'Monthly Pro',
        }),
      ]);
    });
  });

  describe('verifyCheckoutSession', () => {
    it('throws when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyCheckoutSession(999, 'cs_test_missing'),
      ).rejects.toThrow('User not found');
    });

    it('rejects invalid session ID format', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_1',
        isPro: false,
      });

      await expect(service.verifyCheckoutSession(1, 'bad')).rejects.toThrow(
        'Invalid Stripe session ID',
      );
    });

    it('verifies owned completed paid session', async () => {
      const mockUser = {
        id: 1,
        stripeCustomerId: 'cus_1',
        isPro: false,
      } as any;
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.save.mockResolvedValue({ ...mockUser, isPro: true });

      (service as any).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test_123',
              status: 'complete',
              payment_status: 'paid',
              customer: 'cus_1',
              metadata: { userId: '1' },
            }),
          },
        },
      };

      const result = await service.verifyCheckoutSession(1, 'cs_test_123');
      expect(result.verified).toBe(true);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws when session does not exist', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_1',
        isPro: false,
      });
      (service as any).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue(null),
          },
        },
      };

      await expect(
        service.verifyCheckoutSession(1, 'cs_test_missing'),
      ).rejects.toThrow('Checkout session not found');
    });

    it('rejects verification for sessions owned by another user', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_1',
        isPro: false,
      });
      (service as any).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test_forbidden',
              status: 'complete',
              payment_status: 'paid',
              customer: 'cus_other',
              metadata: { userId: '2' },
            }),
          },
        },
      };

      await expect(
        service.verifyCheckoutSession(1, 'cs_test_forbidden'),
      ).rejects.toThrow('You cannot verify this checkout session');
    });

    it('returns an unverified result for incomplete unpaid sessions', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1,
        stripeCustomerId: 'cus_1',
        isPro: false,
      });
      (service as any).stripe = {
        checkout: {
          sessions: {
            retrieve: jest.fn().mockResolvedValue({
              id: 'cs_test_open',
              status: 'open',
              payment_status: 'unpaid',
              customer: 'cus_1',
              metadata: { userId: '1' },
            }),
          },
        },
      };

      const result = await service.verifyCheckoutSession(1, 'cs_test_open');

      expect(result.verified).toBe(false);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });
});
