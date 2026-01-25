import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { User } from '../users/user.entity';
import * as express from 'express';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply raw body middleware for webhook route
        consumer
          .apply(express.raw({ type: 'application/json' }))
          .forRoutes({ path: 'payments/webhook', method: RequestMethod.POST });
    }
}
