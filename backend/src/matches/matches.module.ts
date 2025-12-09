import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { LiveMatchService } from './live-match.service';
import { MatchSchedulerService } from './match-scheduler.service';
import { FootballApiModule } from '../football-api/football-api.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { WebsocketsModule } from '../websockets/websockets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    FootballApiModule,
    TypeOrmModule.forFeature([Match, Team]),
    WebsocketsModule,
    NotificationsModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, LiveMatchService, MatchSchedulerService],
  exports: [MatchesService, LiveMatchService],
})
export class MatchesModule {}
