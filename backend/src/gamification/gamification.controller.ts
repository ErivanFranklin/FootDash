import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('predict')
  // @UseGuards(JwtAuthGuard) // Uncomment when Auth is ready
  async predict(@Body() body: { matchId: number; homeScore: number; awayScore: number }, @Request() req: any) {
    // const userId = req.user.id;
    const userId = 1; // Temporary mock
    return this.gamificationService.submitPrediction(userId, body.matchId, body.homeScore, body.awayScore);
  }
}
