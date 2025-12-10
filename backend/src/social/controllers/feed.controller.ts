import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FeedService } from '../services/feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPersonalFeed(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.feedService.getUserFeed(req.user.sub, page, limit);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async getFollowingFeed(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.feedService.getFollowingFeed(req.user.sub, page, limit);
  }

  @Get('global')
  async getGlobalFeed(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.feedService.getGlobalFeed(page, limit);
  }

  @Get('match/:matchId')
  async getMatchFeed(
    @Param('matchId') matchId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.feedService.getMatchFeed(matchId, page, limit);
  }

  @Get('user/:userId')
  async getUserActivityFeed(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.feedService.getUserActivityFeed(userId, page, limit);
  }
}
