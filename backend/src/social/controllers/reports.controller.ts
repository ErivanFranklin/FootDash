import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  Patch,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { CreateReportDto } from '../dto/create-report.dto';

@ApiTags('social-reports')
@Controller('social/reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  async createReport(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports (Admin only in production)' })
  async getReports(@Query('isResolved') isResolved?: boolean) {
    // Note: In a real app, this would be restricted to Admin role
    return this.reportsService.getReports(isResolved);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Mark a report as resolved' })
  async resolveReport(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.reportsService.resolveReport(id, req.user.sub);
  }
}
