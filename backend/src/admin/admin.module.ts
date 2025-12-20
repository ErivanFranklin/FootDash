import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Report } from '../social/entities/report.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Report])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
