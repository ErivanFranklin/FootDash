import { Injectable, Logger } from '@nestjs/common';
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
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
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
