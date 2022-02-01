import { Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AuctionProvider, AuctionsRedisHandler } from '../auctions';
import { LastOrderRedisHandler } from 'src/db/orders/last-order.redis-handler';

@Module({
  providers: [
    OrdersService,
    OrdersResolver,
    RedisCacheService,
    AuctionProvider,
    AuctionsRedisHandler,
    LastOrderRedisHandler,
  ],
  imports: [ElrondCommunicationModule, OrdersModuleDb, AccountsModuleGraph],
  exports: [OrdersService, RedisCacheService],
})
export class OrdersModuleGraph {}
