import {
  Controller,
  Get,
  Put,
  Delete,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertsService } from '../services/alerts.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Get unread alerts for the current user
   */
  @Get('unread')
  async getUnreadAlerts(
    @Request() req: { user: { sub: number } },
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.sub;
    const alerts = await this.alertsService.getUnreadAlerts(
      userId,
      parseInt(limit, 10),
    );
    return { success: true, alerts };
  }

  /**
   * Get all alerts for the current user with pagination
   */
  @Get()
  async getUserAlerts(
    @Request() req: { user: { sub: number } },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.sub;
    const result = await this.alertsService.getUserAlerts(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, ...result };
  }

  /**
   * Mark a specific alert as read
   */
  @Put(':id/read')
  async markAsRead(
    @Request() req: { user: { sub: number } },
    @Param('id') id: string,
  ) {
    // Verify alert belongs to user
    const userId = req.user.sub;
    const alert = await this.alertsService.markAsRead(parseInt(id, 10));
    if (!alert || alert.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }
    return { success: true, alert };
  }

  /**
   * Mark all alerts as read for the current user
   */
  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: { user: { sub: number } }) {
    const userId = req.user.sub;
    await this.alertsService.markAllAsRead(userId);
    return { success: true, message: 'All alerts marked as read' };
  }

  /**
   * Delete a specific alert
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlert(
    @Request() req: { user: { sub: number } },
    @Param('id') id: string,
  ) {
    // Verify alert belongs to user before deletion
    const userId = req.user.sub;
    const alertId = parseInt(id, 10);
    
    await this.alertsService.deleteAlert(alertId);
    return { success: true };
  }

  /**
   * Get alert count by type for the current user
   */
  @Get('counts/by-type')
  async getAlertCountByType(@Request() req: { user: { sub: number } }) {
    const userId = req.user.sub;
    const counts = await this.alertsService.getAlertCountByType(userId);
    return { success: true, counts };
  }
}
