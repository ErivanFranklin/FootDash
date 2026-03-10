import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly defaultPriceId: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    this.defaultPriceId = this.configService.get<string>(
      'STRIPE_PRO_PRICE_ID',
      '',
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('create-checkout-session')
  async createCheckoutSession(
    @CurrentUser() user: { sub: number; email: string },
    @Body('priceId') priceId?: string,
  ) {
    const actualPriceId = priceId || this.defaultPriceId;
    if (!actualPriceId) {
      throw new BadRequestException(
        'No price ID provided and STRIPE_PRO_PRICE_ID is not configured',
      );
    }
    return this.paymentsService.createCheckoutSession(user.sub, actualPriceId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }
    return this.paymentsService.handleWebhook(signature, rawBody);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@CurrentUser() user: { sub: number }) {
    return this.paymentsService.getSubscriptionInfo(user.sub);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@CurrentUser() user: { sub: number }) {
    return this.paymentsService.getPaymentHistory(user.sub);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('verify-session/:sessionId')
  async verifySession(
    @CurrentUser() user: { sub: number },
    @Param('sessionId') sessionId: string,
  ) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }
    return this.paymentsService.verifyCheckoutSession(user.sub, sessionId);
  }
}
