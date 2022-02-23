import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { OrderEntity, OrdersServiceDb } from '.';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    forwardRef(() => OrdersModuleDb),
  ],
  providers: [RedisCacheService, OrdersServiceDb],
  exports: [RedisCacheService, OrdersServiceDb],
})
export class OrdersModuleDb {}
