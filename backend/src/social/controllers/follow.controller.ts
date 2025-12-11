import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FollowService } from '../services/follow.service';
import { CreateFollowDto } from '../dto/follow.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  async followUser(
    @Request() req: { user: { sub: number } },
    @Body() dto: CreateFollowDto,
  ) {
    const followerId = req.user.sub;
    const follow = await this.followService.followUser(followerId, dto);
    return { success: true, follow: this.followService.toResponseDto(follow) };
  }

  @Delete(':userId')
  async unfollowUser(
    @Request() req: { user: { sub: number } },
    @Param('userId') userId: string,
  ) {
    const followerId = req.user.sub;
    await this.followService.unfollowUser(followerId, parseInt(userId));
    return { success: true, message: 'Unfollowed successfully' };
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.followService.getFollowers(
      parseInt(userId),
      query,
    );
    return { success: true, ...result };
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.followService.getFollowing(
      parseInt(userId),
      query,
    );
    return { success: true, ...result };
  }

  @Get('stats/:userId')
  async getFollowStats(
    @Request() req: { user?: { sub: number } },
    @Param('userId') userId: string,
  ) {
    const currentUserId = req.user?.sub || null;
    const stats = await this.followService.getFollowStats(
      currentUserId,
      parseInt(userId),
    );
    return { success: true, stats };
  }

  @Get('check/:userId')
  async checkFollowing(
    @Request() req: { user: { sub: number } },
    @Param('userId') userId: string,
  ) {
    const followerId = req.user.sub;
    const isFollowing = await this.followService.isFollowing(
      followerId,
      parseInt(userId),
    );
    return { success: true, isFollowing };
  }
}
