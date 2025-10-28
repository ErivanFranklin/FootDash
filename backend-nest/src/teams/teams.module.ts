import { Module } from '@nestjs/common';
import { FootballApiModule } from '../football-api/football-api.module';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [FootballApiModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
