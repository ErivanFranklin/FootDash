import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { FeedQueryDto } from '../dto/activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserFeed(@Request() req, @Query() query: FeedQueryDto) {
    const userId = req.user.sub;
    const result = await this.feedService.getUserFeed(userId, query);
    return { success: true, ...result };
  }

  @Get('global')
  async getGlobalFeed(@Query() query: FeedQueryDto) {
    const result = await this.feedService.getGlobalFeed(query);
    return { success: true, ...result };
  }

  @Get('match/:matchId')
  async getMatchFeed(
    @Param('matchId') matchId: string,
    @Query() query: FeedQueryDto,
  ) {
    const result = await this.feedService.getMatchFeed(parseInt(matchId), query);
    return { success: true, ...result };
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() query: FeedQueryDto,
  ) {
    const result = await this.feedService.getUserActivity(parseInt(userId), query);
    return { success: true, ...result };
  }
}
