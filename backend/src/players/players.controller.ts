import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayersService } from './players.service';

@ApiTags('Players')
@Controller('players')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'List players for fantasy transfer market' })
  async list(
    @Query('position') position?: string,
    @Query('search') search?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playersService.list({
      position,
      search,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
