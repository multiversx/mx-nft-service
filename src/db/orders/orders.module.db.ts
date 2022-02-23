import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { LastOrderRedisHandler } from 'src/modules/orders/loaders/last-order.redis-handler';
import { OrdersRedisHandler } from 'src/modules/orders/loaders/orders.redis-handler';
import { OrderEntity, OrdersServiceDb } from '.';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [
    RedisCacheService,
    OrdersServiceDb,
    OrdersRedisHandler,
    LastOrderRedisHandler,
  ],
  exports: [OrdersServiceDb],
})
export class OrdersModuleDb {}
