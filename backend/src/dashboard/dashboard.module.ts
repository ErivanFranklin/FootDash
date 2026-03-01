import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { FavoritesModule } from '../favorites/favorites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Team]),
    FavoritesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
