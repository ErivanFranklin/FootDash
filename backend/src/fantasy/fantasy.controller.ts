import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FantasyLeagueService } from './fantasy-league.service';

@ApiTags('Fantasy League')
@Controller('fantasy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FantasyController {
  constructor(private readonly fantasyService: FantasyLeagueService) {}

  // ── Leagues ───────────────────────────────────────────────────────────────

  @Post('leagues')
  @ApiOperation({ summary: 'Create a new fantasy league' })
  async createLeague(
    @Req() req: any,
    @Body() body: { name: string; maxMembers?: number; season?: string; leagueId?: number },
  ) {
    return this.fantasyService.createLeague(req.user.id, body);
  }

  @Post('leagues/join')
  @ApiOperation({ summary: 'Join a fantasy league with invite code' })
  async joinLeague(@Req() req: any, @Body() body: { inviteCode: string }) {
    return this.fantasyService.joinLeague(req.user.id, body.inviteCode);
  }

  @Get('leagues')
  @ApiOperation({ summary: 'List my fantasy leagues' })
  async getMyLeagues(@Req() req: any) {
    return this.fantasyService.getMyLeagues(req.user.id);
  }

  @Get('leagues/:id')
  @ApiOperation({ summary: 'Get fantasy league details' })
  async getLeague(@Param('id', ParseIntPipe) id: number) {
    return this.fantasyService.getLeague(id);
  }

  @Get('leagues/:id/standings')
  @ApiOperation({ summary: 'Get league standings' })
  async getStandings(@Param('id', ParseIntPipe) id: number) {
    return this.fantasyService.getStandings(id);
  }

  // ── Teams ─────────────────────────────────────────────────────────────────

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get your fantasy team details' })
  async getTeam(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.fantasyService.getTeam(id, req.user.id);
  }

  @Put('teams/:id/squad')
  @ApiOperation({ summary: 'Set squad (roster)' })
  async setSquad(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body()
    body: {
      roster: {
        playerId: number;
        position: string;
        purchasePrice: number;
        isCaptain?: boolean;
        isViceCaptain?: boolean;
      }[];
    },
  ) {
    return this.fantasyService.setSquad(id, req.user.id, body.roster);
  }

  @Post('teams/:id/transfer')
  @ApiOperation({ summary: 'Make a player transfer' })
  async makeTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() body: { outPlayerId: number; inPlayerId: number; inPrice: number },
  ) {
    await this.fantasyService.makeTransfer(id, req.user.id, body.outPlayerId, body.inPlayerId, body.inPrice);
    return { message: 'Transfer completed' };
  }

  // ── Gameweek Results ──────────────────────────────────────────────────────

  @Get('gameweeks/:id/results')
  @ApiOperation({ summary: 'Get gameweek results' })
  async getGameweekResults(@Param('id', ParseIntPipe) id: number) {
    return this.fantasyService.getGameweekResults(id);
  }
}
