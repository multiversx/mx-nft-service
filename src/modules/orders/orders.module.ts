import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { OrderPriceResolver } from './orderPrice.resolver';
import { PriceServiceUSD } from '../data.service.usd';

@Module({
  providers: [
    OrdersService,
    PriceServiceUSD,
    OrdersResolver,
    OrderPriceResolver,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule, OrdersModuleDb, AccountsModuleGraph],
  exports: [OrdersService, RedisCacheService],
})
export class OrdersModuleGraph {}
