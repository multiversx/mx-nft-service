import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import {
  ActiveOrdersProvider,
  OrderEntity,
  OrdersProvider,
  OrdersServiceDb,
} from '.';

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
