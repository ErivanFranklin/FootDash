import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterNotificationTokenDto } from './dto/register-notification-token.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('tokens')
  registerToken(@Body() payload: RegisterNotificationTokenDto) {
    return this.notificationsService.registerToken(payload);
  }
}
