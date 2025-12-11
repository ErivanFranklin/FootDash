import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MatchPredictionService } from '../services/match-prediction.service';
import { PredictionResultDto } from '../dto/prediction-result.dto';

@ApiTags('Analytics - Predictions')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PredictionsController {
  constructor(private readonly predictionService: MatchPredictionService) {}

  @Get('match/:matchId/prediction')
  @ApiOperation({ summary: 'Get prediction for a specific match' })
  @ApiResponse({
    status: 200,
    description: 'Prediction retrieved successfully',
    type: PredictionResultDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getMatchPrediction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('force') forceRecalculate?: boolean,
  ) {
    return await this.predictionService.getPrediction(
      matchId,
      forceRecalculate === true,
    );
  }

  @Post('match/:matchId/predict')
  @ApiOperation({ summary: 'Generate new prediction for a match' })
  @ApiResponse({
    status: 201,
    description: 'Prediction generated successfully',
    type: PredictionResultDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async generatePrediction(@Param('matchId', ParseIntPipe) matchId: number) {
    return await this.predictionService.generatePrediction(matchId);
  }

  @Get('upcoming-predictions')
  @ApiOperation({ summary: 'Get predictions for upcoming matches' })
  @ApiResponse({
    status: 200,
    description: 'Predictions retrieved successfully',
    type: [PredictionResultDto],
  })
  async getUpcomingPredictions(@Query('limit', ParseIntPipe) limit = 10) {
    return await this.predictionService.getUpcomingPredictions(limit);
  }
}
