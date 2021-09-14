import { Module } from '@nestjs/common';
import { OrdersServiceDb } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { OrdersProvider } from './orders.loader';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { ActiveOrdersProvider } from './active-orders.loader';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [
    OrdersServiceDb,
    OrdersProvider,
    ActiveOrdersProvider,
    RedisCacheService,
  ],
  exports: [OrdersServiceDb, OrdersProvider, ActiveOrdersProvider],
})
export class OrdersModuleDb {}
