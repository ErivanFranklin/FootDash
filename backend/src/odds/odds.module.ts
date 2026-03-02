import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Odds } from './entities/odds.entity';
import { OddsService } from './odds.service';
import { OddsController } from './odds.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Odds]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [OddsController],
  providers: [OddsService],
  exports: [OddsService],
})
export class OddsModule {}
