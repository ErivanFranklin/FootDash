import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('predictions')
  async exportPredictions(
    @CurrentUser() user: { sub: number },
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const data = await this.exportService.getUserPredictions(user.sub);

    if (format === 'csv') {
      const csv = this.exportService.toCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="footdash-predictions-${Date.now()}.csv"`,
      );
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="footdash-predictions-${Date.now()}.json"`,
      );
      res.json(data);
    }
  }

  @Get('stats')
  async exportStats(
    @CurrentUser() user: { sub: number },
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    const data = await this.exportService.getUserStats(user.sub);

    if (format === 'csv') {
      const csv = this.exportService.toCsv([data]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="footdash-stats-${Date.now()}.csv"`,
      );
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="footdash-stats-${Date.now()}.json"`,
      );
      res.json(data);
    }
  }
}
