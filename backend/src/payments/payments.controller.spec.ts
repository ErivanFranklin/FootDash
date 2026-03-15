import { BadRequestException } from '@nestjs/common';

import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  const paymentsServiceMock = {
    createCheckoutSession: jest.fn(),
    handleWebhook: jest.fn(),
    getSubscriptionInfo: jest.fn(),
    getPaymentHistory: jest.fn(),
    verifyCheckoutSession: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses provided price id for checkout session', async () => {
    configServiceMock.get.mockReturnValue('default_price');
    paymentsServiceMock.createCheckoutSession.mockResolvedValue({ id: 'cs_1' });
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await expect(
      controller.createCheckoutSession({ sub: 7, email: 'a@b.com' }, 'custom_price'),
    ).resolves.toEqual({ id: 'cs_1' });

    expect(paymentsServiceMock.createCheckoutSession).toHaveBeenCalledWith(
      7,
      'custom_price',
    );
  });

  it('falls back to configured default price id', async () => {
    configServiceMock.get.mockReturnValue('default_price');
    paymentsServiceMock.createCheckoutSession.mockResolvedValue({ id: 'cs_2' });
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await controller.createCheckoutSession({ sub: 8, email: 'a@b.com' }, undefined);

    expect(paymentsServiceMock.createCheckoutSession).toHaveBeenCalledWith(
      8,
      'default_price',
    );
  });

  it('throws when no default or explicit price id is available', async () => {
    configServiceMock.get.mockReturnValue('');
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await expect(
      controller.createCheckoutSession({ sub: 1, email: 'x@y.com' }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when webhook rawBody is missing', async () => {
    configServiceMock.get.mockReturnValue('default_price');
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await expect(
      controller.handleWebhook('sig', {} as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delegates webhook and user payment endpoints', async () => {
    configServiceMock.get.mockReturnValue('default_price');
    paymentsServiceMock.handleWebhook.mockResolvedValue({ ok: true });
    paymentsServiceMock.getSubscriptionInfo.mockResolvedValue({ isPro: true });
    paymentsServiceMock.getPaymentHistory.mockResolvedValue([{ id: 1 }]);
    paymentsServiceMock.verifyCheckoutSession.mockResolvedValue({ verified: true });
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await expect(
      controller.handleWebhook('sig', { rawBody: Buffer.from('abc') } as any),
    ).resolves.toEqual({ ok: true });
    await expect(controller.getSubscription({ sub: 3 })).resolves.toEqual({
      isPro: true,
    });
    await expect(controller.getHistory({ sub: 3 })).resolves.toEqual([{ id: 1 }]);
    await expect(controller.verifySession({ sub: 3 }, 'sess_1')).resolves.toEqual({
      verified: true,
    });
  });

  it('throws when verify session id is missing', async () => {
    configServiceMock.get.mockReturnValue('default_price');
    const controller = new PaymentsController(
      paymentsServiceMock as any,
      configServiceMock as any,
    );

    await expect(
      controller.verifySession({ sub: 3 }, ''),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
