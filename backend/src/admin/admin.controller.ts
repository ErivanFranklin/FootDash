import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * GET /api/admin/users
   * Get all users with pagination
   */
  @Get('users')
  async getAllUsers(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return this.adminService.getAllUsers(parseInt(limit), parseInt(offset));
  }

  /**
   * GET /api/admin/users/search
   * Search users by email
   */
  @Get('users/search')
  async searchUsers(@Query('email') email: string) {
    if (!email) {
      throw new Error('Email query parameter is required');
    }
    return this.adminService.searchUsers(email);
  }

  /**
   * GET /api/admin/users/:userId
   * Get user details
   */
  @Get('users/:userId')
  async getUserDetails(@Param('userId') userId: string) {
    return this.adminService.getUserDetails(parseInt(userId));
  }

  /**
   * POST /api/admin/users/:userId/block
   * Block a user
   */
  @Post('users/:userId/block')
  async blockUser(@Param('userId') userId: string) {
    return this.adminService.blockUser(parseInt(userId));
  }

  /**
   * POST /api/admin/users/:userId/unblock
   * Unblock a user
   */
  @Post('users/:userId/unblock')
  async unblockUser(@Param('userId') userId: string) {
    return this.adminService.unblockUser(parseInt(userId));
  }

  /**
   * DELETE /api/admin/users/:userId
   * Delete a user
   */
  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(parseInt(userId));
  }

  /**
   * GET /api/admin/reports
   * Get all reports with pagination and optional status filter
   */
  @Get('reports')
  async getAllReports(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllReports(
      parseInt(limit),
      parseInt(offset),
      status,
    );
  }

  /**
   * GET /api/admin/reports/:reportId
   * Get report details
   */
  @Get('reports/:reportId')
  async getReportDetails(@Param('reportId') reportId: string) {
    return this.adminService.getReportDetails(parseInt(reportId));
  }

  /**
   * POST /api/admin/reports/:reportId/approve
   * Approve a report and take action
   */
  @Post('reports/:reportId/approve')
  async approveReport(
    @Param('reportId') reportId: string,
    @Body('action') action: 'block_user' | 'delete_comment' | 'warn_user',
  ) {
    return this.adminService.approveReport(parseInt(reportId), action);
  }

  /**
   * POST /api/admin/reports/:reportId/reject
   * Reject a report
   */
  @Post('reports/:reportId/reject')
  async rejectReport(@Param('reportId') reportId: string) {
    return this.adminService.rejectReport(parseInt(reportId));
  }

  /**
   * GET /api/admin/health
   * Get system health and statistics
   */
  @Get('health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
