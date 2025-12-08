import { Controller, Post, Body, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('tokens')
  registerToken(@Body() payload: RegisterNotificationTokenDto) {
    return this.notificationsService.registerToken(payload);
  }

  @Get('diagnostics')
  async diagnostics() {
    return this.notificationsService.getTokenDiagnostics();
  }
}
