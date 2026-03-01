import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../teams/entities/team.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Match } from '../matches/entities/match.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Team, UserProfile, Match])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
