import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
        this.logger.warn('STRIPE_SECRET_KEY is not set. Payments will not work.');
    }
    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      apiVersion: '2025-12-15.clover' as any, // Latest API version mismatch workaround
    });
  }

  async createCheckoutSession(userId: number, priceId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }

    // Create or retrieve Stripe Customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await this.stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id.toString() }
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await this.userRepository.save(user);
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get('FRONTEND_URL')}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/payments/cancel`,
      metadata: {
        userId: userId.toString(),
      },
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new Error('Webhook signature verification failed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfillOrder(session);
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
    }

    return { received: true };
  }

  async getSubscriptionInfo(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      return {
        tier: user.isPro ? 'pro' : 'free',
        status: user.isPro ? 'active' : 'none',
      };
    }

    const subscriptions = await this.stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    const subscription = subscriptions.data[0];
    if (!subscription) {
      return {
        tier: user.isPro ? 'pro' : 'free',
        status: user.isPro ? 'active' : 'none',
        stripeCustomerId: user.stripeCustomerId,
      };
    }

    const status = this.mapStripeStatus(subscription.status);
    const currentPeriodEndRaw = (subscription as any).current_period_end ?? (subscription as any).currentPeriodEnd;
    return {
      tier: user.isPro ? 'pro' : 'free',
      status,
      currentPeriodEnd: currentPeriodEndRaw
        ? new Date(currentPeriodEndRaw * 1000).toISOString()
        : undefined,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end ?? false,
      stripeCustomerId: user.stripeCustomerId,
    };
  }

  async getPaymentHistory(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid || invoice.amount_due || invoice.total || 0,
      currency: invoice.currency,
      status: invoice.status || 'unknown',
      createdAt: new Date(invoice.created * 1000).toISOString(),
      description:
        invoice.description || invoice.lines.data[0]?.description || undefined,
    }));
  }

  async verifyCheckoutSession(userId: number, sessionId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!sessionId.startsWith('cs_')) {
      throw new BadRequestException('Invalid Stripe session ID');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    const metadataUserId = Number(session.metadata?.userId);
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    const ownsSession =
      metadataUserId === userId ||
      (!!customerId && !!user.stripeCustomerId && customerId === user.stripeCustomerId);

    if (!ownsSession) {
      throw new ForbiddenException('You cannot verify this checkout session');
    }

    const isCompleted = session.status === 'complete';
    const isPaid =
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';
    const verified = isCompleted && isPaid;

    if (verified && !user.isPro) {
      user.isPro = true;
      if (customerId && !user.stripeCustomerId) {
        user.stripeCustomerId = customerId;
      }
      await this.userRepository.save(user);
    }

    return {
      verified,
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
    };
  }

  private mapStripeStatus(status: Stripe.Subscription.Status) {
    if (status === 'active') return 'active';
    if (status === 'trialing') return 'trialing';
    if (status === 'past_due') return 'past_due';
    if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
      return 'canceled';
    }
    return 'none';
  }

  private async fulfillOrder(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (userId) {
        this.logger.log(`Upgrading user ${userId} to Pro`);
        await this.userRepository.update(userId, { isPro: true });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
      // Find user by stripe customer id and downgrade
      const customerId = subscription.customer as string;
      const user = await this.userRepository.findOne({ where: { stripeCustomerId: customerId }});
      if (user) {
          this.logger.log(`Downgrading user ${user.id} from Pro`);
          user.isPro = false;
          await this.userRepository.save(user);
      }
  }
}
