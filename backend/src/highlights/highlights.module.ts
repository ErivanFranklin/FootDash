import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Highlight } from './entities/highlight.entity';
import { HighlightsService } from './highlights.service';
import { HighlightsController } from './highlights.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Highlight]),
    HttpModule.register({ timeout: 10000 }),
  ],
  controllers: [HighlightsController],
  providers: [HighlightsService],
  exports: [HighlightsService],
})
export class HighlightsModule {}
