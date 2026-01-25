import { Controller, Post, Body, Headers, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity'; // Adjust path if needed
import { Request } from 'express';

// Helper decorator to get user from request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@CurrentUser() user: any, @Body('priceId') priceId: string) {
    // In a real app, priceId might be config or hardcoded for simple tiers
    // Using a default test price if not provided
    const actualPriceId = priceId || 'price_1Qj...'; // Placeholder
    return this.paymentsService.createCheckoutSession(user.userId, actualPriceId);
  }

  @Post('webhook')
  async handleWebhook(@Headers('stripe-signature') signature: string, @Req() req: Request) {
    // IMPORTANT: For this to work, the raw body must be available on the request.
    // In default NestJS/Express, body is already parsed.
    // We assume rawBody is preserved or we handle it via middleware.
    // For now, typecasting req.body might fail if parsed JSON.
    // Standard solution involves a raw-body middleware.
    
    // Assuming 'rawBody' property exists on request from middleware
    const rawBody = (req as any).rawBody; 
    if (!rawBody) {
        throw new BadRequestException('Raw body not available');
    }
    
    return this.paymentsService.handleWebhook(signature, rawBody);
  }
}
