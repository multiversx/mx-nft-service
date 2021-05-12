import { Module } from '@nestjs/common';
import { OrdersServiceDb } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [OrdersServiceDb],
  exports: [OrdersServiceDb],
})
export class OrdersModuleDb {}
