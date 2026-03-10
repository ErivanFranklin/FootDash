import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Gamification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly badgeService: BadgeService,
  ) {}

  @Post('predict')
  async predict(
    @CurrentUser() user: { sub: number; email: string },
    @Body() body: { matchId: number; homeScore: number; awayScore: number },
  ) {
    const prediction = await this.gamificationService.submitPrediction(
      user.sub,
      body.matchId,
      body.homeScore,
      body.awayScore,
    );
    // Check for badge unlocks after submitting a prediction
    const newBadges = await this.badgeService.checkAndAward(user.sub);
    return { prediction, newBadges };
  }

  @Get('badges')
  async getAllBadges(@CurrentUser() user: { sub: number }) {
    const badges = await this.badgeService.getAllBadges(user.sub);
    return { success: true, badges };
  }

  @Get('badges/user/:userId')
  async getUserBadges(@Param('userId') userId: string) {
    const badges = await this.badgeService.getUserBadges(parseInt(userId));
    return { success: true, badges };
  }

  @Post('badges/check')
  async checkBadges(@CurrentUser() user: { sub: number }) {
    const newBadges = await this.badgeService.checkAndAward(user.sub);
    return { success: true, newBadges };
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('period') period: 'weekly' | 'monthly' | 'all-time' = 'weekly',
  ) {
    return this.gamificationService.getLeaderboard(period);
  }

  @Post('leaderboard/rebuild')
  async rebuildLeaderboard() {
    return this.gamificationService.rebuildLeaderboards([
      'weekly',
      'monthly',
      'all-time',
    ]);
  }
}
