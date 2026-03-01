import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPrediction } from '../gamification/entities/user-prediction.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPrediction])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
