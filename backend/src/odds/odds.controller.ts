import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OddsService } from './odds.service';

@ApiTags('Odds')
@Controller('odds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { ttl: 60_000, limit: 20 } })
export class OddsController {
  constructor(private readonly service: OddsService) {}

  @Get()
  @ApiOperation({ summary: 'Get upcoming match odds' })
  @ApiQuery({ name: 'limit', required: false })
  async getUpcoming(
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    return this.service.findUpcoming(limit);
  }

  @Get('value-bets')
  @ApiOperation({ summary: 'Get value bets (edge above threshold)' })
  @ApiQuery({ name: 'minEdge', required: false })
  async getValueBets(
    @Query('minEdge', new DefaultValuePipe(5), ParseIntPipe) minEdge: number,
  ) {
    return this.service.getValueBets(minEdge);
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get odds for a specific match across bookmakers' })
  async getByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.service.findByMatch(matchId);
  }
}
