import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FollowService } from '../services/follow.service';
import { FeedService } from '../services/feed.service';
import { CreateFollowDto } from '../dto/follow.dto';
import { ActivityType, ActivityTargetType } from '../entities/user-activity.entity';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    private readonly followService: FollowService,
    private readonly feedService: FeedService,
  ) {}

  @Post()
  async followUser(@Request() req, @Body() dto: CreateFollowDto) {
    const follow = await this.followService.followUser(req.user.sub, dto);
    
    // Add to activity feed
    await this.feedService.addActivity(
      req.user.sub,
      ActivityType.FOLLOW,
      ActivityTargetType.USER,
      dto.followingId,
    );

    return follow;
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowUser(@Param('userId') userId: number, @Request() req) {
    await this.followService.unfollowUser(req.user.sub, userId);
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followService.getFollowers(userId, page, limit);
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.followService.getFollowing(userId, page, limit);
  }

  @Get('stats/:userId')
  async getFollowStats(@Param('userId') userId: number) {
    return this.followService.getFollowStats(userId);
  }

  @Get('check/:userId')
  async isFollowing(@Param('userId') userId: number, @Request() req) {
    const isFollowing = await this.followService.isFollowing(req.user.sub, userId);
    return { isFollowing };
  }
}
