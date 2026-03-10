import {
  Controller,
  Get,
  Param,
  Post,
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
import { HighlightsService } from './highlights.service';

@ApiTags('Highlights')
@Controller('highlights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class HighlightsController {
  constructor(private readonly service: HighlightsService) {}

  @Get()
  @ApiOperation({ summary: 'List all highlights (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search highlights by query' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') q: string) {
    return this.service.search(q || '');
  }

  @Get('match/:matchId')
  @ApiOperation({ summary: 'Get highlights for a specific match' })
  async findByMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.service.findByMatch(matchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single highlight by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  async incrementView(@Param('id', ParseIntPipe) id: number) {
    await this.service.incrementView(id);
    return { message: 'View recorded' };
  }
}
