import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FantasyLeague,
  FantasyTeam,
  FantasyRoster,
  FantasyGameweek,
  FantasyPoints,
} from './entities/fantasy.entities';
import { FantasyLeagueService } from './fantasy-league.service';
import { FantasyController } from './fantasy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FantasyLeague,
      FantasyTeam,
      FantasyRoster,
      FantasyGameweek,
      FantasyPoints,
    ]),
  ],
  controllers: [FantasyController],
  providers: [FantasyLeagueService],
  exports: [FantasyLeagueService],
})
export class FantasyModule {}
