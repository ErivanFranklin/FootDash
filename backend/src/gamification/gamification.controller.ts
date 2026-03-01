import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Gamification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('predict')
  async predict(
    @CurrentUser() user: { sub: number; email: string },
    @Body() body: { matchId: number; homeScore: number; awayScore: number },
  ) {
    return this.gamificationService.submitPrediction(
      user.sub,
      body.matchId,
      body.homeScore,
      body.awayScore,
    );
  }
}
