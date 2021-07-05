import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module';
import { RedisCacheService } from 'src/common/services/redis-cache.service';

@Module({
  providers: [OrdersService, OrdersResolver, RedisCacheService],
  imports: [ElrondCommunicationModule, OrdersModuleDb],
  exports: [OrdersService, RedisCacheService],
})
export class OrdersModuleGraph {}
