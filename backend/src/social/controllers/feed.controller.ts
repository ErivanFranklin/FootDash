import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedService } from '../services/feed.service';
import { FeedQueryDto, FeedType } from '../dto/activity.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserFeed(
    @Request() req: { user: { sub: number } },
    @Query() query: FeedQueryDto,
  ) {
    const userId = req.user.sub;

    // Route to global or personalized feed based on feedType query param
    if (query.feedType === FeedType.GLOBAL) {
      const result = await this.feedService.getGlobalFeed(query);
      return { success: true, ...result };
    }

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
    const result = await this.feedService.getMatchFeed(
      parseInt(matchId),
      query,
    );
    return { success: true, ...result };
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() query: FeedQueryDto,
  ) {
    const result = await this.feedService.getUserActivity(
      parseInt(userId),
      query,
    );
    return { success: true, ...result };
  }
}
