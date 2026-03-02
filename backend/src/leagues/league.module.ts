import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { League } from './entities/league.entity';
import { LeagueService } from './league.service';
import { LeagueController } from './league.controller';
import { FootballApiModule } from '../football-api/football-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([League]),
    FootballApiModule,
  ],
  controllers: [LeagueController],
  providers: [LeagueService],
  exports: [LeagueService],
})
export class LeagueModule implements OnModuleInit {
  constructor(private readonly leagueService: LeagueService) {}

  async onModuleInit() {
    await this.leagueService.seedIfEmpty();
  }
}
