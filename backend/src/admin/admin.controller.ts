import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { UserRole } from '../users/user.entity';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserProDto } from './dto/update-user-pro.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly analyticsService: AdminAnalyticsService,
  ) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async listUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isPro') isPro?: string,
  ) {
    const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
    const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
    const parsedRole = role && ['USER', 'ADMIN', 'MODERATOR'].includes(role.toUpperCase())
      ? (role.toUpperCase() as 'USER' | 'ADMIN' | 'MODERATOR')
      : undefined;
    const parsedIsPro = isPro === 'true' ? true : isPro === 'false' ? false : undefined;
    return this.adminService.listUsers(parsedLimit, parsedOffset, search, parsedRole, parsedIsPro);
  }

  @Patch('users/role')
  async updateUserRole(
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Patch('users/pro')
  async updateUserPro(
    @Query('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserProDto,
  ) {
    return this.adminService.updateUserPro(userId, dto.isPro);
  }

  @Get('analytics/registrations')
  async getRegistrationTrend(
    @Query('days') days?: string,
  ) {
    const parsedDays = Number.isFinite(Number(days)) ? Number(days) : 30;
    return this.analyticsService.getRegistrationTrend(parsedDays);
  }

  @Get('analytics/active-users')
  async getActiveUsers(
    @Query('days') days?: string,
  ) {
    const parsedDays = Number.isFinite(Number(days)) ? Number(days) : 30;
    return this.analyticsService.getActiveUsers(parsedDays);
  }

  @Get('analytics/prediction-accuracy')
  async getPredictionAccuracy() {
    return this.analyticsService.getPredictionAccuracy();
  }

  @Get('analytics/growth')
  async getGrowthMetrics() {
    return this.analyticsService.getGrowthMetrics();
  }

  @Get('analytics/role-distribution')
  async getRoleDistribution() {
    return this.analyticsService.getRoleDistribution();
  }
}
